-- ShareWood — plus d'accès limité selon l'activité ; 3 publications récompensées par jour.
-- À exécuter après 017_rewards.sql ; relançable sans risque. (Si 009 ou 016 sont relancées, relancer celle-ci.)

-- ---------- Tout le monde voit toutes les offres, actif ou non ----------
-- Ne pas contribuer a une seule conséquence : on ne gagne pas de Flèches.
drop policy if exists "bons plans lisibles" on public.deals;
create policy "bons plans lisibles" on public.deals for select to authenticated using (true);
drop function if exists public.has_full_access();
drop function if exists public.active_users_in_zone(text); -- seuil de masquage abandonné depuis 016

-- La date de dernière contribution ne sert plus : on cesse de la relever et on l'efface.
-- (La colonne reste : d'anciens scripts de démo la remplissent.)
drop trigger if exists deals_contribution on public.deals;
drop function if exists public.touch_contribution_deal();
create or replace function public.touch_contribution_vote() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.created_at := now(); -- re-voter rafraîchit le vote
  return new;
end $$;
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, privacy_accepted_at)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 40),
    case when new.raw_user_meta_data->>'privacy_accepted' = 'true' then now() end
  );
  return new;
end $$;
update public.profiles set last_contribution_at = null where last_contribution_at is not null;

-- ---------- 3 publications récompensées par jour (jour à l'heure de Paris) ----------
-- Au-delà, l'offre est publiée normalement ; une ligne à 0 Flèche le retient (ni création, ni bonus).
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
        new.author_id, new.id, 'create', case when rewarded < 3 then 50 else 0 end, true, new.created_at);
    end if;
  end if;
  return new;
end $$;

-- Remplace la version de 016 : pas de bonus pour une offre publiée au-delà du plafond.
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
    perform public.arrow_award(d.author_id, p_deal, 'bonus', 30, true, now());
  end if;
end $$;
