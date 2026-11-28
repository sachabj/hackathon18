-- ShareWood — tirage de la tombola et offres « Avant-Première » (tâche 42 ; à exécuter après 018 ; relançable sans risque).
-- Relancer ce fichier si 018 est relancée (elle rouvre la lecture de toutes les offres).

-- ---------- Tombola ----------
-- drawn_at : date du tirage auquel le ticket a participé (null : pas encore tiré). Non écrivables par l'app.
alter table public.user_rewards add column if not exists drawn_at timestamptz;
alter table public.user_rewards add column if not exists won boolean not null default false;

-- Tirage, lancé par l'équipe dans le SQL Editor :  select * from public.draw_raffle();
-- Un ticket au hasard parmi ceux pas encore tirés ; tous passent « tirés ».
create or replace function public.draw_raffle(p_reward_id text default 'tombola')
returns table (winning_code text, tickets int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  winner uuid;
  total int;
begin
  perform pg_advisory_xact_lock(hashtextextended('raffle:' || p_reward_id, 0));
  select u.id into winner from public.user_rewards u join public.rewards r on r.id = u.reward_id
   where u.reward_id = p_reward_id and r.category = 'raffle' and u.drawn_at is null
   order by gen_random_uuid() limit 1;
  if winner is null then
    raise exception 'Aucun ticket à tirer.';
  end if;
  update public.user_rewards set drawn_at = now(), won = (id = winner)
   where reward_id = p_reward_id and drawn_at is null;
  get diagnostics total = row_count;
  return query select u.code, total from public.user_rewards u where u.id = winner;
end $$;
revoke execute on function public.draw_raffle(text) from public, anon, authenticated;

-- ---------- Avant-Première ----------
-- early_until : avant cette heure, l'offre n'est lisible que par son auteur et les détenteurs de l'Accès Avant-Première.
alter table public.deals add column if not exists early_until timestamptz;
grant insert (early_until) on public.deals to authenticated; -- à la publication seulement

-- La durée est fixée par la base (1 h), et seule une offre officielle (commerçant) peut être une offre flash.
create or replace function public.set_early_until() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and new.early_until is not null then
    new.early_until := case when new.is_official then now() + interval '1 hour' end;
  end if;
  return new;
end $$;
drop trigger if exists deals_early_until on public.deals;
create trigger deals_early_until before insert on public.deals
  for each row execute function public.set_early_until();

drop policy if exists "bons plans lisibles" on public.deals;
create policy "bons plans lisibles" on public.deals for select to authenticated using (
  early_until is null
  or early_until <= now()
  or author_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.early_access_until > now())
);
