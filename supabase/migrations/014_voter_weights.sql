-- ShareWood — fiabilité façon Waze : poids par utilisateur (à exécuter après 013 ; relançable sans risque).
-- Les profils des autres ne sont pas lisibles : les poids sont calculés ici et ne sortent jamais un par un.
--
-- Poids d'un étudiant (borné entre 0,5 et 2), produit de :
--   • justesse : part de ses réactions qui vont dans le sens des autres sur la même offre (offres avec au moins
--     2 autres réactions et un avis net), lissée (a + 2) / (n + 3) → 0,4 + 0,9 × justesse (≈ 1 pour un nouveau) ;
--   • activité : contributions des 30 derniers jours (bons plans + réactions) → 1 à 1,5 ;
--   • ancienneté : compte de moins de 3 jours → × 0,6 (anti faux comptes).
-- Masse d'une réaction = poids × 0,5^(âge / 48 h) ; un « Plus dispo » plus récent que la dernière confirmation × 1,5.
-- Constantes reprises dans src/lib/rules.ts : les modifier aux deux endroits.

create or replace function public.voter_stats()
returns table (user_id uuid, weight real, accuracy real, judged int, contributions_30d int, account_days int)
language sql stable security definer set search_path = public as $$
  with judged_votes as (
    select v.user_id, v.value,
           (select sum(o.value) from public.votes o where o.deal_id = v.deal_id and o.user_id <> v.user_id) as others_sum,
           (select count(*) from public.votes o where o.deal_id = v.deal_id and o.user_id <> v.user_id) as others_n
    from public.votes v
  ),
  acc as (
    select j.user_id,
           count(*) filter (where j.others_n >= 2 and j.others_sum <> 0) as judged,
           count(*) filter (where j.others_n >= 2 and j.others_sum <> 0 and sign(j.others_sum) = sign(j.value)) as agreed
    from judged_votes j group by j.user_id
  ),
  contrib as (
    select x.user_id, count(*) as n from (
      select d.author_id as user_id from public.deals d
       where d.author_id is not null and d.created_at > now() - interval '30 days'
      union all
      select v.user_id from public.votes v where v.created_at > now() - interval '30 days'
    ) x group by x.user_id
  ),
  parts as (
    select p.id,
           (coalesce(a.agreed, 0) + 2)::float8 / (coalesce(a.judged, 0) + 3) as accuracy,
           coalesce(a.judged, 0)::int as judged,
           coalesce(c.n, 0)::int as contributions,
           floor(extract(epoch from now() - p.created_at)::float8 / 86400)::int as days
    from public.profiles p
    left join acc a on a.user_id = p.id
    left join contrib c on c.user_id = p.id
  )
  select id,
         least(2, greatest(0.5,
           (0.4 + 0.9 * accuracy)
           * (1 + 0.5 * least(1, ln(1 + contributions::float8) / ln(21::float8)))
           * (case when days < 3 then 0.6 else 1 end)
         ))::real,
         accuracy::real, judged, contributions, days
  from parts;
$$;

-- Masses pondérées des réactions, par bon plan (seulement pour les identifiants demandés).
create or replace function public.deal_trust(p_ids uuid[])
returns table (deal_id uuid, pos real, neg real)
language sql stable security definer set search_path = public as $$
  with w as (select s.user_id, s.weight from public.voter_stats() s),
  last_ok as (
    select v.deal_id, max(v.created_at) as at from public.votes v
     where v.value = 1 and v.deal_id = any (p_ids) group by v.deal_id
  ),
  masses as (
    select v.deal_id, v.value,
           coalesce(w.weight, 1)::float8
           * power(0.5::float8, extract(epoch from now() - v.created_at)::float8 / 3600 / 48)
           * case when v.value = -1 and (l.at is null or v.created_at > l.at) then 1.5 else 1 end as m
    from public.votes v
    left join w on w.user_id = v.user_id
    left join last_ok l on l.deal_id = v.deal_id
    where v.deal_id = any (p_ids)
  )
  select deal_id,
         coalesce(sum(m) filter (where value = 1), 0)::real,
         coalesce(sum(m) filter (where value = -1), 0)::real
  from masses group by deal_id;
$$;

-- Son propre rang (page profil) : personne d'autre ne voit le poids d'un étudiant.
create or replace function public.my_influence()
returns table (weight real, accuracy real, judged int, contributions_30d int, account_days int)
language sql stable security definer set search_path = public as $$
  select s.weight, s.accuracy, s.judged, s.contributions_30d, s.account_days
  from public.voter_stats() s where s.user_id = auth.uid();
$$;

revoke execute on function public.voter_stats() from public, anon, authenticated;
revoke execute on function public.deal_trust(uuid[]), public.my_influence() from public, anon;
grant execute on function public.deal_trust(uuid[]), public.my_influence() to authenticated;
