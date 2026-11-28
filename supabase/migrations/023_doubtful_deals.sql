-- ShareWood — retrait des offres signalées (à exécuter après 022 ; relançable sans risque).
-- Remplace l'archivage immédiat au 3e « Plus dispo ». Seuils repris dans src/lib/rules.ts.
--   3 « Plus dispo » ............... l'offre devient « Douteux » (toujours visible) pour 2 semaines
--   3 « J'en ai profité » ensuite .. elle est sauvée : les signalements précédents ne comptent plus
--   sinon, au bout de 2 semaines ... elle est retirée de l'application
--   6 « Plus dispo » en 48 h ....... retirée tout de suite (une confirmation entre-temps remet ce compte à zéro)
-- Un retrait est définitif. Les Flèches des signalements sont versées au retrait, perdues si l'offre est sauvée.

alter table public.deals add column if not exists doubtful_since timestamptz;   -- non écrivables par l'app
alter table public.deals add column if not exists reports_reset_at timestamptz;

-- État d'une offre après un changement de réactions (ou à l'échéance), puis bonus de l'auteur.
create or replace function public.arrow_refresh_deal(p_deal uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  d public.deals;
  confirmations int;
  last_confirm timestamptz;
  doubt timestamptz;
  reset timestamptz;
  saved int;
  reports int;
  burst int;
  remove boolean := false;
begin
  select * into d from public.deals where id = p_deal;
  if not found then return; end if;
  select count(*), max(created_at) into confirmations, last_confirm
    from public.votes where deal_id = p_deal and value = 1 and user_id is distinct from d.author_id;

  if d.archived_at is null then
    doubt := d.doubtful_since;
    reset := d.reports_reset_at;
    if doubt is not null then
      select count(*) into saved from public.votes
       where deal_id = p_deal and value = 1 and user_id is distinct from d.author_id
         and created_at > doubt and created_at <= doubt + interval '14 days';
      if saved >= 3 then
        doubt := null;
        reset := now();
        delete from public.arrow_events where deal_id = p_deal and kind = 'report' and not paid;
      elsif now() >= doubt + interval '14 days' then
        remove := true;
      end if;
    end if;
    if not remove then
      select count(*), count(*) filter (where created_at > greatest(now() - interval '48 hours', last_confirm, reset))
        into reports, burst
        from public.votes
       where deal_id = p_deal and value = -1 and user_id is distinct from d.author_id
         and created_at > coalesce(reset, '-infinity');
      if burst >= 6 then
        remove := true;
      elsif reports >= 3 then
        doubt := coalesce(doubt, now());
      else
        doubt := null;
      end if;
    end if;
    update public.deals
       set doubtful_since = doubt, reports_reset_at = reset, archived_at = case when remove then now() end
     where id = p_deal;
    if remove then
      update public.arrow_events set paid = true where deal_id = p_deal and kind = 'report' and not paid;
    end if;
  end if;

  if confirmations < 3 then
    delete from public.arrow_events where deal_id = p_deal and kind = 'bonus';
  elsif not d.is_official and public.arrow_is_student(d.author_id)
        and not exists (select 1 from public.arrow_events
                         where user_id = d.author_id and deal_id = p_deal and kind = 'create' and amount = 0) then
    perform public.arrow_award(
      d.author_id, p_deal, 'bonus', case when d.lat is null or d.lng is null then 10 else 30 end, true, now());
  end if;
end $$;

-- Retire les offres douteuses arrivées à échéance. Appelée par l'app au chargement (pas de tâche planifiée).
create or replace function public.settle_doubtful_deals() returns int
language plpgsql security definer set search_path = public as $$
declare
  due uuid;
  done int := 0;
begin
  for due in
    select id from public.deals where archived_at is null and doubtful_since <= now() - interval '14 days' order by id
  loop
    perform pg_advisory_xact_lock(hashtextextended('arrows-deal:' || due, 0));
    perform public.arrow_refresh_deal(due);
    done := done + 1;
  end loop;
  return done;
end $$;

-- Réactions : version de 020, sans gain sur une offre déjà retirée.
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

revoke execute on function public.arrow_refresh_deal(uuid), public.arrow_on_vote() from public, anon, authenticated;
revoke execute on function public.settle_doubtful_deals() from public, anon;
grant execute on function public.settle_doubtful_deals() to authenticated;
