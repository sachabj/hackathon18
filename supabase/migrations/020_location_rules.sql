-- ShareWood — Flèches et localisation (à exécuter après 019_golden_badge_text.sql ; relançable sans risque).
-- Barème repris dans src/lib/arrows.ts (affichage) : le modifier aux deux endroits.
--
--                                    offre sur la carte          offre sans lieu précis
--   publier ......................... +50 (sur place)             +20
--   3 confirmations reçues .......... +30                         +10
--   « J'y suis allé » ............... +10 (sur place)             +3
--   « Plus dispo » .................. +15 (sur place)             +5
--
-- « Sur place » : position partagée à 500 m au plus de l'offre. Sans elle, la réaction ou la publication
-- est enregistrée normalement, sans Flèches. La position n'est jamais enregistrée.
-- Inchangé : série × 1,5, 5 votes et 3 publications récompensés par jour, signalements versés au 3e.

-- Distance en mètres à vol d'oiseau (formule de haversine).
create or replace function public.arrow_distance_m(lat1 float8, lng1 float8, lat2 float8, lng2 float8) returns float8
language sql immutable as $$
  select 12742000 * asin(least(1, sqrt(
    sin(radians(lat2 - lat1) / 2) ^ 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(radians(lng2 - lng1) / 2) ^ 2)));
$$;

-- ---------- Réactions ----------
create or replace function public.arrow_on_vote() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  k text := case when new.value = 1 then 'confirm' else 'report' end;
  lat float8 := nullif(current_setting('arrows.lat', true), '')::float8;
  lng float8 := nullif(current_setting('arrows.lng', true), '')::float8;
  d public.deals;
  placed boolean;
  gain int;
  used int;
  event public.arrow_events;
  status text;
begin
  -- Deux votes simultanés ne doivent ni dépasser le plafond, ni manquer le 3e signalement.
  perform pg_advisory_xact_lock(hashtextextended('arrows-user:' || new.user_id, 0));
  perform pg_advisory_xact_lock(hashtextextended('arrows-deal:' || new.deal_id, 0));
  select * into d from public.deals where id = new.deal_id;

  -- Changement d'avis : l'ancienne récompense disparaît.
  delete from public.arrow_events
   where user_id = new.user_id and deal_id = new.deal_id and kind in ('confirm', 'report') and kind <> k;

  if public.arrow_is_student(new.user_id) and new.user_id is distinct from d.author_id then
    insert into public.activity_days (user_id, day) values (new.user_id, public.arrow_day(new.created_at))
      on conflict do nothing;

    if exists (select 1 from public.arrow_events where user_id = new.user_id and deal_id = new.deal_id and kind = k) then
      status := 'already';
    else
      placed := d.lat is not null and d.lng is not null;
      -- La position sert seulement à ce calcul : elle n'est pas enregistrée.
      if not placed then
        gain := case k when 'confirm' then 3 else 5 end;
      elsif lat is null or lng is null then
        gain := 0;
        status := 'noloc';
      elsif public.arrow_distance_m(lat, lng, d.lat, d.lng) > 500 then
        gain := 0;
        status := 'far';
      else
        gain := case k when 'confirm' then 10 else 15 end;
      end if;
      select count(*) into used from public.arrow_events
       where user_id = new.user_id and kind in ('confirm', 'report')
         and public.arrow_day(created_at) = public.arrow_day(new.created_at);

      if gain > 0 and used >= 5 then
        status := 'limit';
      elsif gain > 0 then
        event := public.arrow_award(new.user_id, new.deal_id, k, gain, k = 'confirm', new.created_at);
        status := case when event.paid then 'paid' else 'pending' end;
      end if;
    end if;
  end if;

  perform public.arrow_refresh_deal(new.deal_id);

  if status is not null then
    -- Ce vote a pu être le 3e signalement.
    if status = 'pending' and exists (select 1 from public.arrow_events where id = event.id and paid) then
      status := 'paid';
    end if;
    perform set_config('arrows.outcome', json_build_object(
      'status', status, 'kind', k, 'amount', coalesce(event.amount, 0),
      'multiplier', coalesce(event.multiplier, 1),
      'archived', (select archived_at is not null from public.deals where id = new.deal_id)
    )::text, true);
  end if;
  return new;
end $$;

-- ---------- Publication ----------
-- Une offre sans lieu rapporte tout de suite. Pour un lieu précis, une ligne à 0 Flèche attend que l'app
-- fasse vérifier la position (claim_creation_arrows) ; tant qu'elle reste à 0, pas de bonus non plus.
create or replace function public.arrow_on_deal() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  rewarded int;
begin
  if public.arrow_is_student(new.author_id) then
    insert into public.activity_days (user_id, day) values (new.author_id, public.arrow_day(new.created_at))
      on conflict do nothing;
    if not new.is_official then
      -- Même verrou que les votes : des publications simultanées ne dépassent pas le plafond.
      perform pg_advisory_xact_lock(hashtextextended('arrows-user:' || new.author_id, 0));
      select count(*) into rewarded from public.arrow_events
       where user_id = new.author_id and kind = 'create' and amount > 0
         and public.arrow_day(created_at) = public.arrow_day(new.created_at);
      perform public.arrow_award(
        new.author_id, new.id, 'create',
        case when (new.lat is null or new.lng is null) and rewarded < 3 then 20 else 0 end,
        true, new.created_at);
    end if;
  end if;
  return new;
end $$;

-- Juste après la publication d'un lieu précis : verse les +50 si l'auteur est sur place.
create or replace function public.claim_creation_arrows(p_deal_id uuid, p_lat float8 default null, p_lng float8 default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  d public.deals;
  event public.arrow_events;
  rewarded int;
  m numeric := 1;
  status text;
begin
  if not public.arrow_is_student(me) then return null; end if;
  perform pg_advisory_xact_lock(hashtextextended('arrows-user:' || me, 0));
  perform pg_advisory_xact_lock(hashtextextended('arrows-deal:' || p_deal_id, 0));
  select * into d from public.deals where id = p_deal_id and author_id = me;
  -- Seulement son offre, placée, publiée à l'instant (pas question de revenir plus tard sur place).
  if not found or d.is_official or d.lat is null or d.lng is null or d.created_at < now() - interval '15 minutes' then
    return null;
  end if;
  select * into event from public.arrow_events where user_id = me and deal_id = d.id and kind = 'create';
  if not found or event.amount > 0 then return null; end if;

  if p_lat is null or p_lng is null then
    status := 'noloc';
  elsif public.arrow_distance_m(p_lat, p_lng, d.lat, d.lng) > 500 then
    status := 'far';
  else
    select count(*) into rewarded from public.arrow_events
     where user_id = me and kind = 'create' and amount > 0
       and public.arrow_day(created_at) = public.arrow_day(d.created_at);
    if rewarded >= 3 then
      status := 'limit';
    else
      status := 'paid';
      if public.arrow_streak(me, public.arrow_day(d.created_at)) >= 3 then m := 1.5; end if;
      update public.arrow_events set base = 50, multiplier = m, amount = round(50 * m)
       where id = event.id returning * into event;
      perform public.arrow_refresh_deal(d.id);
    end if;
  end if;
  return json_build_object('status', status, 'amount', event.amount, 'multiplier', event.multiplier);
end $$;

-- Bonus de l'auteur : 30 sur la carte, 10 sans lieu ; aucun si la publication n'a rien rapporté.
create or replace function public.arrow_refresh_deal(p_deal uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  d public.deals;
  confirmations int;
  reports int;
begin
  select * into d from public.deals where id = p_deal;
  if not found then return; end if;
  select count(*) filter (where value = 1), count(*) filter (where value = -1) into confirmations, reports
    from public.votes where deal_id = p_deal and user_id is distinct from d.author_id;

  if (reports >= 3) <> (d.archived_at is not null) then
    update public.deals set archived_at = case when reports >= 3 then now() end where id = p_deal;
  end if;
  update public.arrow_events set paid = (reports >= 3)
   where deal_id = p_deal and kind = 'report' and paid <> (reports >= 3);

  if confirmations < 3 then
    delete from public.arrow_events where deal_id = p_deal and kind = 'bonus';
  elsif not d.is_official and public.arrow_is_student(d.author_id)
        and not exists (select 1 from public.arrow_events
                         where user_id = d.author_id and deal_id = p_deal and kind = 'create' and amount = 0) then
    perform public.arrow_award(
      d.author_id, p_deal, 'bonus', case when d.lat is null or d.lng is null then 10 else 30 end, true, now());
  end if;
end $$;

revoke execute on function
  public.arrow_distance_m(float8, float8, float8, float8),
  public.arrow_on_deal(), public.arrow_on_vote(), public.arrow_refresh_deal(uuid)
from public, anon, authenticated;
revoke execute on function public.claim_creation_arrows(uuid, float8, float8) from public, anon;
grant execute on function public.claim_creation_arrows(uuid, float8, float8) to authenticated;
