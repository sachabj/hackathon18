-- ShareWood — profil : étudiants aidés, parrainage, école, aide (à exécuter après 021 ; relançable sans risque).
--   parrainage : +100 Flèches au parrain, +50 au filleul, versées à la PREMIÈRE publication ou réaction du
--   filleul ; 10 parrainages au plus sont payés à un même parrain.

-- ---------- École (privée : la table n'est lisible que par son propriétaire) ----------
alter table public.preferences add column if not exists school text check (char_length(school) <= 80);

-- ---------- Clics « Y aller » et liens partagés ouverts ----------
create table if not exists public.deal_directions (
  deal_id uuid not null references public.deals on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (deal_id, user_id)
);
create table if not exists public.deal_shares (
  deal_id uuid not null references public.deals on delete cascade,
  sharer_id uuid not null references public.profiles on delete cascade,
  viewer_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (deal_id, sharer_id, viewer_id)
);

-- ---------- Parrainage ----------
create table if not exists public.referral_codes (
  user_id uuid primary key references public.profiles on delete cascade,
  referral_code text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists public.referrals (
  referee_id uuid primary key references public.profiles on delete cascade, -- un seul parrain par compte
  referrer_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  rewarded_at timestamptz,          -- première action du filleul
  referrer_paid boolean not null default false,
  check (referee_id <> referrer_id)
);
create index if not exists referrals_referrer_idx on public.referrals (referrer_id);

-- ---------- Aide et signalement de bug (lus par l'équipe dans le tableau de bord Supabase) ----------
create table if not exists public.support_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  kind text not null check (kind in ('bug', 'help')),
  message text not null check (char_length(trim(message)) between 5 and 2000),
  created_at timestamptz not null default now()
);

alter table public.deal_directions enable row level security;
alter table public.deal_shares enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.support_messages enable row level security;
-- Chacun ne lit que ses lignes ; les auteurs n'obtiennent que des totaux (my_impact).
drop policy if exists "lire ses itinéraires" on public.deal_directions;
create policy "lire ses itinéraires" on public.deal_directions for select to authenticated using (user_id = auth.uid());
drop policy if exists "noter son itinéraire" on public.deal_directions;
create policy "noter son itinéraire" on public.deal_directions for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "lire ses ouvertures" on public.deal_shares;
create policy "lire ses ouvertures" on public.deal_shares for select to authenticated using (viewer_id = auth.uid());
drop policy if exists "lire son code" on public.referral_codes;
create policy "lire son code" on public.referral_codes for select to authenticated using (user_id = auth.uid());
drop policy if exists "lire ses parrainages" on public.referrals;
create policy "lire ses parrainages" on public.referrals for select to authenticated
  using (referrer_id = auth.uid() or referee_id = auth.uid());
drop policy if exists "lire ses messages" on public.support_messages;
create policy "lire ses messages" on public.support_messages for select to authenticated using (user_id = auth.uid());
drop policy if exists "écrire à l'équipe" on public.support_messages;
create policy "écrire à l'équipe" on public.support_messages for insert to authenticated with check (user_id = auth.uid());
revoke all on public.deal_directions, public.deal_shares, public.referral_codes, public.referrals, public.support_messages
  from anon, authenticated;
grant select on public.deal_directions, public.deal_shares, public.referral_codes, public.referrals, public.support_messages
  to authenticated;
grant insert (deal_id, user_id) on public.deal_directions to authenticated;
grant insert (kind, message) on public.support_messages to authenticated;

create or replace function public.support_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.support_messages
       where user_id = new.user_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Tu as déjà envoyé 10 messages aujourd''hui : réessaie demain.';
  end if;
  return new;
end $$;
drop trigger if exists support_messages_limit on public.support_messages;
create trigger support_messages_limit before insert on public.support_messages
  for each row execute function public.support_limit();

-- Lien partagé ouvert par un autre étudiant connecté.
create or replace function public.record_share_open(p_deal_id uuid, p_code text) returns void
language plpgsql security definer set search_path = public as $$
declare
  sharer uuid;
begin
  select user_id into sharer from public.referral_codes where referral_code = upper(trim(p_code));
  if sharer is null or auth.uid() is null or sharer = auth.uid()
     or not exists (select 1 from public.deals where id = p_deal_id) then
    return;
  end if;
  insert into public.deal_shares (deal_id, sharer_id, viewer_id) values (p_deal_id, sharer, auth.uid())
    on conflict do nothing;
end $$;

-- Étudiants aidés : chaque personne compte une fois, quel que soit le nombre de gestes.
create or replace function public.my_impact() returns json
language sql stable security definer set search_path = public as $$
  with mine as (select id from public.deals where author_id = auth.uid()),
  gestures as (
    select 'validations' as source, v.user_id as person, true as on_mine
      from public.votes v join mine on mine.id = v.deal_id where v.value = 1
    union all
    select 'validations', x.user_id, true from public.deal_visits x join mine on mine.id = x.deal_id
    union all
    select 'favorites', f.user_id, true from public.favorites f join mine on mine.id = f.deal_id
    union all
    select 'directions', g.user_id, true from public.deal_directions g join mine on mine.id = g.deal_id
    union all
    -- Liens que j'ai partagés, et liens vers mes offres partagés par d'autres.
    select 'shares', s.viewer_id, s.deal_id in (select id from mine) from public.deal_shares s
     where s.sharer_id = auth.uid() or s.deal_id in (select id from mine)
  ),
  others as (
    select g.* from gestures g
     where g.person <> auth.uid() and public.arrow_is_student(g.person)
  )
  select json_build_object(
    'people_helped', (select count(distinct person) from others),
    'via_deals', (select count(distinct person) from others where on_mine),
    'via_shares', (select count(distinct person) from others
                    where person not in (select person from others where on_mine)),
    'validations', (select count(distinct person) from others where source = 'validations'),
    'favorites', (select count(distinct person) from others where source = 'favorites'),
    'directions', (select count(distinct person) from others where source = 'directions'),
    'shares', (select count(distinct person) from others where source = 'shares'),
    -- Mes « Plus dispo » confirmés par la communauté (offre archivée) : à part, non additionnés.
    'reports_confirmed', (select count(*) from public.votes v join public.deals d on d.id = v.deal_id
                           where v.user_id = auth.uid() and v.value = -1 and d.archived_at is not null
                             and d.author_id is distinct from v.user_id)
  );
$$;

-- Code « WOOD-ALEX26 » : début du pseudo et deux chiffres (davantage si déjà pris). Créé à la première demande.
create or replace function public.ensure_referral_code() returns text
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  code text;
  stem text;
  tries int := 0;
begin
  if not public.arrow_is_student(me) then return null; end if;
  select referral_code into code from public.referral_codes where user_id = me;
  if code is not null then return code; end if;
  -- Premier mot du pseudo, accents retirés (la décomposition NFD sépare la lettre de son accent).
  select upper(substr(regexp_replace(normalize(split_part(trim(coalesce(username, '')), ' ', 1), nfd),
                                     '[^a-zA-Z]', '', 'g'), 1, 8))
    into stem from public.profiles where id = me;
  if coalesce(stem, '') = '' then stem := 'AMI'; end if;
  loop
    tries := tries + 1;
    code := 'WOOD-' || stem || lpad((floor(random() * case when tries < 20 then 100 else 1000000 end))::text,
                                    case when tries < 20 then 2 else 6 end, '0');
    insert into public.referral_codes (user_id, referral_code) values (me, code) on conflict do nothing;
    select referral_code into code from public.referral_codes where user_id = me;
    exit when code is not null;
  end loop;
  return code;
end $$;

-- Mon parrainage : code, amis (actifs ou pas encore) et Flèches gagnées en parrainant.
create or replace function public.my_referrals() returns json
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  code text := public.ensure_referral_code();
begin
  return json_build_object(
    'referral_code', code,
    'friends', (select count(*) from public.referrals where referrer_id = me and rewarded_at is not null),
    'pending', (select count(*) from public.referrals where referrer_id = me and rewarded_at is null),
    'arrows', (select coalesce(sum(amount), 0) from public.arrow_events where user_id = me and kind = 'referral')
  );
end $$;

-- Avant l'inscription : le code saisi existe-t-il ? (ne dit rien sur son propriétaire)
create or replace function public.check_referral_code(p_code text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.referral_codes where referral_code = upper(trim(p_code)));
$$;

-- ---------- Inscription : le parrain est retenu (remplace la version de 018) ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, privacy_accepted_at)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 40),
    case when new.raw_user_meta_data->>'privacy_accepted' = 'true' then now() end
  );
  if coalesce(new.raw_user_meta_data->>'account_type', '') <> 'merchant' then
    insert into public.referrals (referee_id, referrer_id)
    select new.id, c.user_id from public.referral_codes c
     where c.referral_code = upper(trim(new.raw_user_meta_data->>'referral_code')) and c.user_id <> new.id
    on conflict do nothing;
  end if;
  return new;
end $$;

-- ---------- Versement à la première action du filleul ----------
alter table public.arrow_events drop constraint if exists arrow_events_kind_check;
alter table public.arrow_events add constraint arrow_events_kind_check
  check (kind in ('create', 'bonus', 'confirm', 'report', 'referral', 'welcome'));

-- `activity_days` reçoit une ligne quand un étudiant publie ou réagit.
create or replace function public.referral_on_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r public.referrals;
  pay boolean;
begin
  select * into r from public.referrals where referee_id = new.user_id and rewarded_at is null for update;
  if not found then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('referrals:' || r.referrer_id, 0));
  pay := public.arrow_is_student(r.referrer_id)
    and (select count(*) from public.referrals where referrer_id = r.referrer_id and referrer_paid) < 10;
  update public.referrals set rewarded_at = now(), referrer_paid = pay where referee_id = r.referee_id;
  insert into public.arrow_events (user_id, kind, base, amount) values (r.referee_id, 'welcome', 50, 50);
  if pay then
    insert into public.arrow_events (user_id, kind, base, amount) values (r.referrer_id, 'referral', 100, 100);
  end if;
  return new;
end $$;
drop trigger if exists activity_referral on public.activity_days;
create trigger activity_referral after insert on public.activity_days
  for each row execute function public.referral_on_activity();

revoke execute on function public.support_limit(), public.referral_on_activity() from public, anon, authenticated;
revoke execute on function public.record_share_open(uuid, text), public.my_impact(),
  public.ensure_referral_code(), public.my_referrals() from public, anon;
grant execute on function public.record_share_open(uuid, text), public.my_impact(),
  public.ensure_referral_code(), public.my_referrals() to authenticated;
grant execute on function public.check_referral_code(text) to anon, authenticated;
