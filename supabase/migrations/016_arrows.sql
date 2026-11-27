-- ShareWood — « Les Flèches » : points, série, plafond, distance et archivage à 3 signalements.
-- À exécuter après 014_voter_weights.sql ; relançable sans risque.
-- Tout est calculé ici par des triggers : l'app ne peut que LIRE ses propres Flèches.
-- Barème repris dans src/lib/arrows.ts (affichage) : le modifier aux deux endroits.
--
--   création d'une offre (étudiant) ............ +50
--   l'offre atteint 3 confirmations ............ +30 pour son auteur
--   confirmer qu'une offre est active .......... +10
--   signaler une offre expirée ................. +15, versées au 3e signalement (offre alors archivée)
--   série d'au moins 3 jours d'activité ........ gains × 1,5
--   votes récompensés .......................... 5 par jour (jour à l'heure de Paris)
--   distance connue à une offre placée ......... ≤ 500 m : tout · ≤ 2 km : la moitié · au-delà : rien
-- Un vote retiré, ou une offre supprimée par son auteur, retire les Flèches correspondantes.

alter table public.deals add column if not exists archived_at timestamptz; -- non écrivable par l'app

-- Journal des Flèches. `paid` = false : signalement en attente de deux autres.
create table if not exists public.arrow_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  deal_id uuid references public.deals on delete set null,
  kind text not null check (kind in ('create', 'bonus', 'confirm', 'report')),
  base int not null check (base >= 0),        -- après distance, avant la série
  multiplier numeric(3, 2) not null default 1,
  amount int not null check (amount >= 0),
  paid boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, deal_id, kind)             -- une seule récompense par étudiant, offre et action
);
create index if not exists arrow_events_user_idx on public.arrow_events (user_id, created_at desc);
create index if not exists arrow_events_deal_idx on public.arrow_events (deal_id);

-- Jours où l'étudiant a publié ou voté (série).
create table if not exists public.activity_days (
  user_id uuid not null references public.profiles on delete cascade,
  day date not null,
  primary key (user_id, day)
);

alter table public.arrow_events enable row level security;
alter table public.activity_days enable row level security;
drop policy if exists "lire ses flèches" on public.arrow_events;
create policy "lire ses flèches" on public.arrow_events for select to authenticated using (user_id = auth.uid());
drop policy if exists "lire ses jours" on public.activity_days;
create policy "lire ses jours" on public.activity_days for select to authenticated using (user_id = auth.uid());
revoke all on public.arrow_events, public.activity_days from anon, authenticated;
grant select on public.arrow_events, public.activity_days to authenticated;

create or replace function public.arrow_day(t timestamptz) returns date
language sql stable as $$ select (t at time zone 'Europe/Paris')::date $$;

-- Jours d'activité consécutifs jusqu'à p_day (ou jusqu'à la veille : la série n'est pas encore perdue).
create or replace function public.arrow_streak(p_user uuid, p_day date) returns int
language sql stable security definer set search_path = public as $$
  with days as (
    select day, max(day) over () - day as gap, row_number() over (order by day desc) - 1 as rank
    from public.activity_days where user_id = p_user and day <= p_day
  )
  select case when coalesce(max(day) >= p_day - 1, false) then (count(*) filter (where gap = rank))::int else 0 end
  from days;
$$;

-- Les commerçants ne gagnent pas de Flèches.
create or replace function public.arrow_is_student(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = p_user and role = 'student');
$$;

-- Enregistre un gain (multiplicateur de série compris) ; null s'il avait déjà été enregistré.
create or replace function public.arrow_award(p_user uuid, p_deal uuid, p_kind text, p_base int, p_paid boolean, p_at timestamptz)
returns public.arrow_events language plpgsql security definer set search_path = public as $$
declare
  m numeric := case when public.arrow_streak(p_user, public.arrow_day(p_at)) >= 3 then 1.5 else 1 end;
  result public.arrow_events;
begin
  insert into public.arrow_events (user_id, deal_id, kind, base, multiplier, amount, paid, created_at)
  values (p_user, p_deal, p_kind, p_base, m, round(p_base * m), p_paid, p_at)
  on conflict (user_id, deal_id, kind) do nothing
  returning * into result;
  return result;
end $$;

-- Après un changement de votes : archivage, signalements payés ou en attente, bonus de l'auteur.
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
  elsif not d.is_official and public.arrow_is_student(d.author_id) then
    perform public.arrow_award(d.author_id, p_deal, 'bonus', 30, true, now());
  end if;
end $$;

create or replace function public.arrow_on_deal() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.arrow_is_student(new.author_id) then
    insert into public.activity_days (user_id, day) values (new.author_id, public.arrow_day(new.created_at))
      on conflict do nothing;
    if not new.is_official then
      perform public.arrow_award(new.author_id, new.id, 'create', 50, true, new.created_at);
    end if;
  end if;
  return new;
end $$;

-- Offre supprimée : l'auteur perd création et bonus ; les votants gardent les Flèches déjà versées.
create or replace function public.arrow_on_deal_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.arrow_events where deal_id = old.id and (kind in ('create', 'bonus') or not paid);
  return old;
end $$;

create or replace function public.arrow_on_vote() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  k text := case when new.value = 1 then 'confirm' else 'report' end;
  lat float8 := nullif(current_setting('arrows.lat', true), '')::float8;
  lng float8 := nullif(current_setting('arrows.lng', true), '')::float8;
  d public.deals;
  meters float8;
  factor numeric := 1;
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
      -- La position sert seulement à ce calcul : elle n'est pas enregistrée.
      if lat is not null and lng is not null and d.lat is not null and d.lng is not null then
        meters := 12742000 * asin(sqrt(
          sin(radians(d.lat - lat) / 2) ^ 2 + cos(radians(lat)) * cos(radians(d.lat)) * sin(radians(d.lng - lng) / 2) ^ 2));
        factor := case when meters <= 500 then 1 when meters <= 2000 then 0.5 else 0 end;
      end if;
      gain := round((case k when 'confirm' then 10 else 15 end) * factor);
      select count(*) into used from public.arrow_events
       where user_id = new.user_id and kind in ('confirm', 'report')
         and public.arrow_day(created_at) = public.arrow_day(new.created_at);

      if gain = 0 then
        status := 'far';
      elsif used >= 5 then
        status := 'limit';
      else
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
      'multiplier', coalesce(event.multiplier, 1), 'factor', factor,
      'archived', (select archived_at is not null from public.deals where id = new.deal_id)
    )::text, true);
  end if;
  return new;
end $$;

-- Vote retiré : la récompense aussi. (Rien à faire si l'offre ou le compte disparaît.)
create or replace function public.arrow_on_unvote() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.deals where id = old.deal_id)
     and exists (select 1 from public.profiles where id = old.user_id) then
    perform pg_advisory_xact_lock(hashtextextended('arrows-user:' || old.user_id, 0));
    perform pg_advisory_xact_lock(hashtextextended('arrows-deal:' || old.deal_id, 0));
    delete from public.arrow_events
     where user_id = old.user_id and deal_id = old.deal_id and kind in ('confirm', 'report');
    perform public.arrow_refresh_deal(old.deal_id);
  end if;
  return old;
end $$;

drop trigger if exists deals_arrows on public.deals;
create trigger deals_arrows after insert on public.deals for each row execute function public.arrow_on_deal();
drop trigger if exists deals_arrows_delete on public.deals;
create trigger deals_arrows_delete before delete on public.deals
  for each row execute function public.arrow_on_deal_delete();
drop trigger if exists votes_arrows on public.votes;
create trigger votes_arrows after insert or update on public.votes
  for each row execute function public.arrow_on_vote();
drop trigger if exists votes_arrows_delete on public.votes;
create trigger votes_arrows_delete after delete on public.votes
  for each row execute function public.arrow_on_unvote();

-- Voter en transmettant sa position (facultative) et recevoir le résultat. Les droits sur `votes` s'appliquent.
create or replace function public.react_to_deal(p_deal_id uuid, p_value int, p_lat float8 default null, p_lng float8 default null)
returns json language plpgsql security invoker set search_path = public as $$
begin
  perform set_config('arrows.lat', coalesce(p_lat::text, ''), true);
  perform set_config('arrows.lng', coalesce(p_lng::text, ''), true);
  perform set_config('arrows.outcome', '', true);
  insert into public.votes (deal_id, user_id, value) values (p_deal_id, auth.uid(), p_value)
    on conflict (deal_id, user_id) do update set value = excluded.value;
  return nullif(current_setting('arrows.outcome', true), '')::json;
end $$;

-- Ses propres Flèches : solde, série, votes récompensés du jour et historique récent.
create or replace function public.my_arrows() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'total', coalesce(sum(amount) filter (where paid), 0),
    'pending', coalesce(sum(amount) filter (where not paid), 0),
    'streak', public.arrow_streak(auth.uid(), public.arrow_day(now())),
    'today_votes', count(*) filter (where kind in ('confirm', 'report') and public.arrow_day(created_at) = public.arrow_day(now())),
    'history', coalesce((
      select json_agg(h) from (
        select e.id, e.kind, e.amount, e.multiplier, e.paid, e.created_at, d.title
        from public.arrow_events e left join public.deals d on d.id = e.deal_id
        where e.user_id = auth.uid()
        order by e.created_at desc, e.id desc limit 12
      ) h), '[]'::json)
  )
  from public.arrow_events where user_id = auth.uid();
$$;

revoke execute on function
  public.arrow_streak(uuid, date), public.arrow_is_student(uuid), public.arrow_refresh_deal(uuid),
  public.arrow_award(uuid, uuid, text, int, boolean, timestamptz),
  public.arrow_on_deal(), public.arrow_on_deal_delete(), public.arrow_on_vote(), public.arrow_on_unvote()
from public, anon, authenticated;
revoke execute on function public.react_to_deal(uuid, int, float8, float8), public.my_arrows() from public, anon;
grant execute on function public.react_to_deal(uuid, int, float8, float8), public.my_arrows() to authenticated;

-- Offres déjà signalées au moins 3 fois avant cette migration.
update public.deals d set archived_at = now()
 where d.archived_at is null
   and (select count(*) from public.votes v
         where v.deal_id = d.id and v.value = -1 and v.user_id is distinct from d.author_id) >= 3;
