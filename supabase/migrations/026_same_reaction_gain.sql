-- ShareWood — même gain pour « Plus dispo » et « J'en ai profité » (tâche 57 ; à exécuter après 023 ; relançable).
-- Sur place : +10 pour les deux (au lieu de +15 pour un signalement) ; offre sans lieu : +3 pour les deux (au lieu de +5).
-- Les gains déjà versés ne changent pas. Barème repris dans src/lib/arrows.ts (ARROWS, ARROWS_NO_PLACE).
-- Version de 023 (aucun gain sur une offre retirée) ; seuls les montants changent. Relancer 026 si 020 ou 023 sont relancées.

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
    elsif d.archived_at is not null then
      status := 'closed'; -- offre déjà retirée : plus rien à gagner
    else
      placed := d.lat is not null and d.lng is not null;
      -- La position sert seulement à ce calcul : elle n'est pas enregistrée.
      if not placed then
        gain := 3;
      elsif lat is null or lng is null then
        gain := 0;
        status := 'noloc';
      elsif public.arrow_distance_m(lat, lng, d.lat, d.lng) > 500 then
        gain := 0;
        status := 'far';
      else
        gain := 10;
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

revoke execute on function public.arrow_on_vote() from public, anon, authenticated;
