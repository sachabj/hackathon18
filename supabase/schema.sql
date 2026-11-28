-- =====================================================================
-- Waze-Etu — schéma Supabase
-- À coller dans Supabase → SQL Editor → Run (une seule fois, sur un projet vide).
-- Toute modif : mettre à jour src/lib/types.ts et memory/ARCHITECTURE.md.
-- =====================================================================

-- ---------- Types ----------
-- « Carte Sortir » n'est plus une catégorie mais une condition (deals.requirements, migration 012).
create type deal_category as enum
  ('restaurant', 'supermarket', 'transport', 'scholarship', 'sport', 'activity');
create type deal_subcategory as enum ('plane', 'train', 'bus', 'carpool');
create type deal_scope as enum ('local', 'zone', 'national');

-- ---------- Tables ----------
create table public.zones (
  id text primary key,
  name text not null,
  center_lat double precision not null,
  center_lng double precision not null,
  radius_m integer not null default 3000
);

insert into public.zones (id, name, center_lat, center_lng, radius_m) values
  ('bruz', 'Bruz', 48.0245, -1.7460, 3000),
  ('ker-lann', 'Ker Lann', 48.0505, -1.7420, 1500);

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text,
  role text not null default 'student' check (role in ('student', 'merchant')),
  followed_categories deal_category[] not null default '{}',
  followed_zone_ids text[] not null default '{}',
  last_contribution_at timestamptz,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category deal_category not null,
  subcategory deal_subcategory,
  scope deal_scope not null default 'local',
  zone_id text references public.zones,
  place_name text,
  lat double precision,
  lng double precision,
  price_info text,
  expires_at timestamptz,
  deadline_at timestamptz,
  is_official boolean not null default false,
  ended_by_merchant boolean not null default false,
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  constraint local_needs_coords check (scope <> 'local' or (lat is not null and lng is not null)),
  constraint subcategory_only_transport check (subcategory is null or category = 'transport')
);
create index deals_created_at_idx on public.deals (created_at desc);

-- Un vote par utilisateur et par bon plan ; on le met à jour (upsert) pour "re-confirmer".
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (deal_id, user_id)
);

create table public.favorites (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  deal_id uuid not null references public.deals on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, deal_id)
);

-- ---------- Fonctions & triggers ----------
-- Profil créé automatiquement à l'inscription.
-- 💡 7 jours d'accès complet offerts à l'inscription (last_contribution_at = now()).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, last_contribution_at)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), now());
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Chaque contribution (bon plan publié ou vote) relance les 7 jours d'accès complet.
create function public.touch_contribution_deal() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set last_contribution_at = now() where id = new.author_id;
  return new;
end $$;

create function public.touch_contribution_vote() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set last_contribution_at = now() where id = new.user_id;
  new.created_at := now();
  return new;
end $$;

create trigger deals_contribution after insert on public.deals
  for each row execute function public.touch_contribution_deal();
create trigger votes_contribution before insert or update on public.votes
  for each row execute function public.touch_contribution_vote();

-- L'utilisateur courant a-t-il contribué dans les 7 derniers jours ?
create function public.has_full_access() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select last_contribution_at > now() - interval '7 days' from public.profiles where id = auth.uid()),
    false);
$$;

create function public.is_merchant() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'merchant');
$$;

-- Nombre d'utilisateurs actifs (7 j) qui suivent une zone → seuil de votes adaptatif.
create function public.active_users_in_zone(z text) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.profiles
  where z = any(followed_zone_ids) and last_contribution_at > now() - interval '7 days';
$$;

-- Contributions par utilisateur et par catégorie → niveaux + messages d'encouragement.
create view public.user_contributions with (security_invoker = on) as
select user_id, category,
       count(*) filter (where created_at > now() - interval '7 days')::int as count_7d,
       count(*) filter (where created_at > now() - interval '30 days')::int as count_30d
from (
  select author_id as user_id, category, created_at from public.deals
  union all
  select v.user_id, d.category, v.created_at from public.votes v join public.deals d on d.id = v.deal_id
) c
group by user_id, category;

-- ---------- Sécurité (RLS) : compte obligatoire pour tout ----------
alter table public.zones enable row level security;
alter table public.profiles enable row level security;
alter table public.deals enable row level security;
alter table public.votes enable row level security;
alter table public.favorites enable row level security;

create policy "zones lisibles" on public.zones for select to authenticated using (true);

create policy "profils lisibles" on public.profiles for select to authenticated using (true);
create policy "modifier son profil" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Inactif : ne voit les nouveaux bons plans qu'après 24 h (sauf les siens).
create policy "bons plans lisibles" on public.deals for select to authenticated using (
  public.has_full_access() or author_id = auth.uid() or created_at < now() - interval '24 hours'
);
create policy "publier" on public.deals for insert to authenticated with check (
  author_id = auth.uid() and (not is_official or public.is_merchant())
);
create policy "modifier ses bons plans" on public.deals for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "supprimer ses bons plans" on public.deals for delete to authenticated
  using (author_id = auth.uid());

create policy "votes lisibles" on public.votes for select to authenticated using (true);
create policy "voter" on public.votes for insert to authenticated with check (user_id = auth.uid());
create policy "changer son vote" on public.votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "ses favoris" on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Droits (GRANT) ----------
grant usage on schema public to authenticated;
grant select on public.zones to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.deals to authenticated;
grant select, insert, update on public.votes to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select on public.user_contributions to authenticated;
grant execute on function public.has_full_access(), public.is_merchant(), public.active_users_in_zone(text) to authenticated;

-- Colonnes sensibles verrouillées (voir migrations/003_column_grants.sql)
revoke update on public.profiles from authenticated;
grant update (username, followed_categories, followed_zone_ids, onboarded) on public.profiles to authenticated;

revoke insert, update on public.deals from authenticated;
grant insert (title, description, category, subcategory, scope, zone_id, place_name, lat, lng,
              price_info, expires_at, deadline_at, is_official, author_id) on public.deals to authenticated;
grant update (title, description, category, subcategory, scope, zone_id, place_name, lat, lng,
              price_info, expires_at, deadline_at, ended_by_merchant) on public.deals to authenticated;

-- =====================================================================
-- Préférences (voir migrations/004_preferences.sql)
-- =====================================================================

insert into public.zones (id, name, center_lat, center_lng, radius_m) values
  ('rennes', 'Rennes', 48.1113, -1.6800, 4000)
on conflict (id) do nothing;

create table if not exists public.preferences (
  user_id uuid primary key default auth.uid() references public.profiles on delete cascade,
  home_zone_id text references public.zones,
  lat double precision,  -- position facultative (bouton « Me localiser »), arrondie à ~100 m par l'app
  lng double precision,
  transport_modes text[] not null default '{}',
  budget_profile text check (budget_profile in ('tight', 'balanced', 'comfort')),
  activities text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.preferences enable row level security;
drop policy if exists "ses préférences" on public.preferences;
create policy "ses préférences" on public.preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.preferences to authenticated;

-- De quoi comparer un bon plan au profil : niveau de prix (0 = gratuit … 3 = €€€) et activités liées.
alter table public.deals add column if not exists price_level smallint check (price_level between 0 and 3);
alter table public.deals add column if not exists tags text[] not null default '{}';
grant insert (price_level, tags), update (price_level, tags) on public.deals to authenticated;

-- ---------- Espace commerçant (voir migrations/005_merchant.sql) ----------
create table if not exists public.businesses (
  owner_id uuid primary key references public.profiles on delete cascade,
  name text not null check (length(trim(name)) between 2 and 80),
  address text,
  category deal_category not null check (category in ('restaurant', 'supermarket', 'activity', 'sport')),
  zone_id text references public.zones,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  created_at timestamptz not null default now()
);

alter table public.businesses enable row level security;
drop policy if exists "commerces lisibles" on public.businesses;
create policy "commerces lisibles" on public.businesses for select to authenticated using (true);
grant select on public.businesses to authenticated; -- écriture : uniquement via register_business()

-- Colonnes non accordées en écriture : seules les fonctions ci-dessous les modifient.
alter table public.deals add column if not exists boosted_until timestamptz;
alter table public.deals add column if not exists ended_by uuid references public.profiles on delete set null;

create or replace function public.register_business(
  p_name text, p_address text, p_category deal_category, p_zone_id text,
  p_lat double precision, p_lng double precision
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;
  if exists (select 1 from public.businesses where owner_id = auth.uid()) then
    raise exception 'Ce compte a déjà un commerce.';
  end if;
  insert into public.businesses (owner_id, name, address, category, zone_id, lat, lng)
  values (auth.uid(), trim(p_name), nullif(trim(p_address), ''), p_category, p_zone_id, p_lat, p_lng);
  update public.profiles set role = 'merchant' where id = auth.uid();
end $$;

-- Mise en avant de 7 jours (paiement simulé dans l'app), cumulable.
create or replace function public.boost_offer(p_deal_id uuid) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare until timestamptz;
begin
  update public.deals
     set boosted_until = greatest(coalesce(boosted_until, now()), now()) + interval '7 days'
   where id = p_deal_id and author_id = auth.uid() and is_official and not ended_by_merchant
     and (expires_at is null or expires_at > now()) and public.is_merchant()
  returning boosted_until into until;
  if until is null then raise exception 'Cette offre ne peut pas être mise en avant.'; end if;
  return until;
end $$;

-- Statistiques de ses propres offres (les favoris sont privés : seul leur nombre est renvoyé).
create or replace function public.my_offer_stats()
returns table (deal_id uuid, confirmations integer, reports integer, favorites integer)
language sql stable security definer set search_path = public as $$
  select d.id,
    (select count(*)::int from public.votes v where v.deal_id = d.id and v.value = 1),
    (select count(*)::int from public.votes v where v.deal_id = d.id and v.value = -1),
    (select count(*)::int from public.favorites f where f.deal_id = d.id)
  from public.deals d
  where d.author_id = auth.uid();
$$;

-- Bons plans d'étudiants que le commerçant peut déclarer terminés : près de chez lui, même catégorie.
create or replace function public.deals_near_my_business() returns setof public.deals
language sql stable security definer set search_path = public as $$
  select d.*
  from public.deals d
  join public.businesses b on b.owner_id = auth.uid()
  where public.is_merchant()
    and d.scope = 'local' and not d.is_official and d.author_id <> b.owner_id
    and d.category = b.category
    and (d.expires_at is null or d.expires_at > now())
    and (not d.ended_by_merchant or d.ended_by = b.owner_id)
    -- distance haversine en mètres
    and 12742000 * asin(sqrt(
          power(sin(radians(d.lat - b.lat) / 2), 2) +
          cos(radians(b.lat)) * cos(radians(d.lat)) * power(sin(radians(d.lng - b.lng) / 2), 2)
        )) <= 75
  order by d.created_at desc;
$$;

create or replace function public.set_nearby_deal_ended(p_deal_id uuid, p_ended boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.deals_near_my_business() n where n.id = p_deal_id) then
    raise exception 'Ce bon plan ne concerne pas votre commerce.';
  end if;
  update public.deals
     set ended_by_merchant = p_ended, ended_by = case when p_ended then auth.uid() end
   where id = p_deal_id;
end $$;

-- L'auteur d'un bon plan ne peut pas annuler le retrait décidé par un commerçant.
create or replace function public.protect_merchant_end() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.ended_by is not null and not new.ended_by_merchant and auth.uid() is distinct from old.ended_by then
    raise exception 'Ce bon plan a été retiré par le commerçant.';
  end if;
  return new;
end $$;

drop trigger if exists deals_protect_merchant_end on public.deals;
create trigger deals_protect_merchant_end before update on public.deals
  for each row execute function public.protect_merchant_end();

revoke execute on function
  public.register_business(text, text, deal_category, text, double precision, double precision),
  public.boost_offer(uuid), public.my_offer_stats(), public.deals_near_my_business(),
  public.set_nearby_deal_ended(uuid, boolean)
from public, anon;
grant execute on function
  public.register_business(text, text, deal_category, text, double precision, double precision),
  public.boost_offer(uuid), public.my_offer_stats(), public.deals_near_my_business(),
  public.set_nearby_deal_ended(uuid, boolean)
to authenticated;

-- =====================================================================
-- Voyages (voir migrations/006_travel.sql)
-- =====================================================================
alter table public.preferences add column if not exists home_visits text
  check (home_visits in ('often', 'sometimes', 'never'));
alter table public.preferences add column if not exists wants_travel boolean;
alter table public.preferences add column if not exists travel_modes text[] not null default '{}';

-- ---------- Audience (voir migrations/007_engagement.sql) ----------
create table if not exists public.deal_views (
  deal_id uuid not null references public.deals on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (deal_id, user_id)
);

create table if not exists public.deal_visits (
  deal_id uuid not null references public.deals on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (deal_id, user_id)
);

alter table public.deal_views enable row level security;
alter table public.deal_visits enable row level security;

-- Chacun ne lit que ses propres lignes : l'auteur n'obtient que des totaux (my_deal_audience).
drop policy if exists "lire ses vues" on public.deal_views;
create policy "lire ses vues" on public.deal_views for select to authenticated using (user_id = auth.uid());
drop policy if exists "enregistrer sa vue" on public.deal_views;
create policy "enregistrer sa vue" on public.deal_views for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.deals d where d.id = deal_id and d.author_id <> auth.uid())
);

drop policy if exists "lire ses passages" on public.deal_visits;
create policy "lire ses passages" on public.deal_visits for select to authenticated using (user_id = auth.uid());
drop policy if exists "déclarer son passage" on public.deal_visits;
create policy "déclarer son passage" on public.deal_visits for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.deals d where d.id = deal_id and d.author_id <> auth.uid())
);
drop policy if exists "retirer son passage" on public.deal_visits;
create policy "retirer son passage" on public.deal_visits for delete to authenticated using (user_id = auth.uid());

grant select on public.deal_views, public.deal_visits to authenticated;
grant insert (deal_id, user_id) on public.deal_views to authenticated;
grant insert (deal_id, user_id) on public.deal_visits to authenticated;
grant delete on public.deal_visits to authenticated;

-- Nombre d'étudiants passés sur un bon plan (affiché à tous).
create or replace function public.deal_visit_count(p_deal_id uuid) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.deal_visits where deal_id = p_deal_id;
$$;

-- Audience de ses propres bons plans (l'auteur est exclu des totaux).
create or replace function public.my_deal_audience()
returns table (deal_id uuid, views integer, visits integer, favorites integer, confirmations integer, reports integer)
language sql stable security definer set search_path = public as $$
  select d.id,
    (select count(*)::int from public.deal_views x where x.deal_id = d.id),
    (select count(*)::int from public.deal_visits x where x.deal_id = d.id),
    (select count(*)::int from public.favorites f where f.deal_id = d.id and f.user_id <> d.author_id),
    (select count(*)::int from public.votes v where v.deal_id = d.id and v.value = 1 and v.user_id <> d.author_id),
    (select count(*)::int from public.votes v where v.deal_id = d.id and v.value = -1 and v.user_id <> d.author_id)
  from public.deals d
  where d.author_id = auth.uid();
$$;

revoke execute on function public.deal_visit_count(uuid), public.my_deal_audience() from public, anon;
grant execute on function public.deal_visit_count(uuid), public.my_deal_audience() to authenticated;

-- ---------- Photo de preuve (migration 008) ----------
alter table public.deals add column if not exists photo_url text;
-- Seuls des liens vers notre propre stockage sont acceptés (pas d'image externe arbitraire).
alter table public.deals drop constraint if exists photo_url_from_storage;
alter table public.deals add constraint photo_url_from_storage
  check (photo_url is null or photo_url like '%/storage/v1/object/public/deal-photos/%');
grant insert (photo_url), update (photo_url) on public.deals to authenticated;

-- Stockage public : l'image est lisible par son lien, sans connexion (photos d'affiches de magasin).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deal-photos', 'deal-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Chaque étudiant ne dépose et ne supprime que dans son dossier `<son id>/…`.
drop policy if exists "photos : déposer dans son dossier" on storage.objects;
create policy "photos : déposer dans son dossier" on storage.objects for insert to authenticated
  with check (bucket_id = 'deal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "photos : supprimer les siennes" on storage.objects;
create policy "photos : supprimer les siennes" on storage.objects for delete to authenticated
  using (bucket_id = 'deal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
-- Compte et confidentialité (voir migrations/009_account.sql)
-- =====================================================================
-- ---------- Anonymat : chacun ne lit que son propre profil ----------
-- Les bons plans et les votes ne portent qu'un identifiant technique, qu'on ne peut plus relier à un pseudo.
drop policy if exists "profils lisibles" on public.profiles;
drop policy if exists "lire son profil" on public.profiles;
create policy "lire son profil" on public.profiles for select to authenticated using (id = auth.uid());

-- ---------- Inscription : acceptation de la politique de confidentialité ----------
-- Date posée par la base à l'inscription, non modifiable depuis l'app (aucun GRANT sur la colonne).
alter table public.profiles add column if not exists privacy_accepted_at timestamptz;

update public.profiles set username = left(username, 40) where char_length(username) > 40;
alter table public.profiles drop constraint if exists username_length;
alter table public.profiles add constraint username_length check (char_length(username) <= 40);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, last_contribution_at, privacy_accepted_at)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 40),
    now(),
    case when new.raw_user_meta_data->>'privacy_accepted' = 'true' then now() end
  );
  return new;
end $$;

-- ---------- Suppression de compte : les bons plans encore utiles restent, sans auteur ----------
alter table public.deals alter column author_id drop not null;
alter table public.deals drop constraint if exists deals_author_id_fkey;
alter table public.deals add constraint deals_author_id_fkey
  foreign key (author_id) references public.profiles on delete set null;

-- « author_id <> moi » est faux quand il n'y a plus d'auteur : on compare avec « is distinct from ».
drop policy if exists "enregistrer sa vue" on public.deal_views;
create policy "enregistrer sa vue" on public.deal_views for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.deals d where d.id = deal_id and d.author_id is distinct from auth.uid())
);
drop policy if exists "déclarer son passage" on public.deal_visits;
create policy "déclarer son passage" on public.deal_visits for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.deals d where d.id = deal_id and d.author_id is distinct from auth.uid())
);

create or replace function public.deals_near_my_business() returns setof public.deals
language sql stable security definer set search_path = public as $$
  select d.*
  from public.deals d
  join public.businesses b on b.owner_id = auth.uid()
  where public.is_merchant()
    and d.scope = 'local' and not d.is_official and d.author_id is distinct from b.owner_id
    and d.category = b.category
    and (d.expires_at is null or d.expires_at > now())
    and (not d.ended_by_merchant or d.ended_by = b.owner_id)
    -- distance haversine en mètres
    and 12742000 * asin(sqrt(
          power(sin(radians(d.lat - b.lat) / 2), 2) +
          cos(radians(b.lat)) * cos(radians(d.lat)) * power(sin(radians(d.lng - b.lng) / 2), 2)
        )) <= 75
  order by d.created_at desc;
$$;

-- Bons plans conservés : encore actifs, et confirmés par d'autres (plus de 👍 que de 👎, auteur exclu).
-- Les offres officielles partent avec le compte du commerçant, qui seul pourrait les retirer.
create or replace function public.my_kept_deals() returns table (deal_id uuid, photo_url text)
language sql stable security definer set search_path = public as $$
  select d.id, to_jsonb(d)->>'photo_url'
  from public.deals d
  where d.author_id = auth.uid()
    and not d.is_official
    and not d.ended_by_merchant
    and (d.expires_at is null or d.expires_at > now())
    and (select count(*) filter (where v.value = 1) > count(*) filter (where v.value = -1)
         from public.votes v where v.deal_id = d.id and v.user_id <> d.author_id);
$$;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Connexion requise.'; end if;
  delete from public.deals d
   where d.author_id = me and not exists (select 1 from public.my_kept_deals() k where k.deal_id = d.id);
  -- Cascade : profil, préférences, votes, favoris, vues, passages, commerce. Bons plans gardés : auteur effacé.
  delete from auth.users where id = me;
end $$;

revoke execute on function public.my_kept_deals(), public.delete_my_account() from public, anon;
grant execute on function public.my_kept_deals(), public.delete_my_account() to authenticated;

-- Pour pouvoir effacer ses photos, il faut d'abord pouvoir lister les siennes.
drop policy if exists "photos : voir les siennes" on storage.objects;
create policy "photos : voir les siennes" on storage.objects for select to authenticated
  using (bucket_id = 'deal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
-- Aides : boursier, Carte Sortir (voir migrations/010_student_aids.sql)
-- =====================================================================
alter table public.preferences add column if not exists is_scholarship boolean;
alter table public.preferences add column if not exists has_carte_sortir boolean;

-- =====================================================================
-- Pas de vote sur son propre bon plan (voir migrations/011_no_self_vote.sql)
-- =====================================================================
-- Les votes déjà enregistrés par des auteurs sur leurs propres bons plans sont effacés.
delete from public.votes v using public.deals d where v.deal_id = d.id and v.user_id = d.author_id;

-- « is distinct from » : un bon plan sans auteur (compte supprimé) reste ouvert aux votes.
drop policy if exists "voter" on public.votes;
create policy "voter" on public.votes for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.deals d where d.id = deal_id and d.author_id is distinct from auth.uid())
);
drop policy if exists "changer son vote" on public.votes;
create policy "changer son vote" on public.votes for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid() and exists (select 1 from public.deals d where d.id = deal_id and d.author_id is distinct from auth.uid())
  );

-- =====================================================================
-- Conditions d'accès et lien d'un bon plan (voir migrations/012_requirements_links.sql)
-- =====================================================================
-- Conditions : carte étudiante, Carte Sortir (n'est plus une catégorie), boursier, moins de 26 ans.
alter table public.deals add column if not exists requirements text[] not null default '{}';
alter table public.deals add column if not exists link_url text;
alter table public.deals drop constraint if exists deals_requirements_check;
alter table public.deals add constraint deals_requirements_check
  check (requirements <@ array['student_card', 'carte_sortir', 'scholarship', 'under_26']::text[]);
alter table public.deals drop constraint if exists deals_link_url_check;
alter table public.deals add constraint deals_link_url_check
  check (link_url is null or (link_url ~* '^https?://[^[:space:]]+$' and char_length(link_url) <= 500));
grant insert (requirements, link_url), update (requirements, link_url) on public.deals to authenticated;

-- =====================================================================
-- Retirer son vote : réactions décochables (voir migrations/013_unvote.sql)
-- =====================================================================
drop policy if exists "retirer son vote" on public.votes;
create policy "retirer son vote" on public.votes for delete to authenticated using (user_id = auth.uid());
grant delete on public.votes to authenticated;

-- =====================================================================
-- Fiabilité façon Waze : poids par utilisateur (voir migrations/014_voter_weights.sql)
-- =====================================================================
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

-- =====================================================================
-- Les Flèches (voir migrations/016_arrows.sql)
-- =====================================================================
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

-- =====================================================================
-- Boutique de récompenses (voir migrations/017_rewards.sql)
-- =====================================================================
-- Avantages dans l'application (non écrivables par l'app).
alter table public.profiles add column if not exists golden_badge boolean not null default false;
alter table public.profiles add column if not exists early_access_until timestamptz;

-- Catalogue.
create table if not exists public.rewards (
  id text primary key,
  category text not null check (category in ('local', 'app', 'raffle')),
  title text not null,
  partner text not null,
  description text not null,
  cost int not null check (cost > 0),
  effect text check (effect in ('early_access', 'golden_badge')),
  sort int not null default 0,
  active boolean not null default true,
  check ((category = 'app') = (effect is not null))
);

-- Échanges : un bon (code unique), un ticket de tombola ou un avantage activé.
create table if not exists public.user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  reward_id text not null references public.rewards,
  cost int not null check (cost > 0),          -- prix payé
  code text unique,                            -- null : avantage dans l'application
  created_at timestamptz not null default now(),
  used_at timestamptz                          -- bon présenté en caisse
);
create index if not exists user_rewards_user_idx on public.user_rewards (user_id, created_at desc);

alter table public.rewards enable row level security;
alter table public.user_rewards enable row level security;
drop policy if exists "catalogue lisible" on public.rewards;
create policy "catalogue lisible" on public.rewards for select to authenticated using (true);
drop policy if exists "lire ses récompenses" on public.user_rewards;
create policy "lire ses récompenses" on public.user_rewards for select to authenticated using (user_id = auth.uid());
revoke all on public.rewards, public.user_rewards from anon, authenticated;
grant select on public.rewards, public.user_rewards to authenticated;

-- Partenaires FICTIFS, marqués « (démo) » : aucun accord réel.
insert into public.rewards (id, category, title, partner, description, cost, effect, sort) values
  ('cafe', 'local', '1 café offert', 'Café des Étangs (démo)',
   'Un café offert sur place, sur présentation du bon.', 100, null, 1),
  ('kebab', 'local', '1 boisson ou dessert offert', 'Kebab du Coin (démo)',
   'Pour l''achat d''un menu : une boisson ou un dessert au choix.', 150, null, 2),
  ('resto', 'local', '-20 % sur l''addition', 'Pizzeria des Deux Rives (démo)',
   '20 % de réduction sur une addition, pour une personne.', 250, null, 3),
  ('early', 'app', 'Accès Avant-Première', 'ShareWood',
   'Pendant 7 jours, les offres flash ou limitées 1 h avant tout le monde.', 200, 'early_access', 4),
  ('golden', 'app', 'Badge Doré', 'ShareWood',
   'Un badge doré sur ta page « Ciblés », pour toujours.', 300, 'golden_badge', 5),
  ('tombola', 'raffle', 'Ticket tombola : 2 places de ciné ou 20 €', 'Tirage ShareWood (démo)',
   'Un ticket par échange, autant de tickets que tu veux.', 50, null, 6)
on conflict (id) do update set
  category = excluded.category, title = excluded.title, partner = excluded.partner,
  description = excluded.description, cost = excluded.cost, effect = excluded.effect, sort = excluded.sort;

create or replace function public.arrows_balance(p_user uuid) returns int
language sql stable security definer set search_path = public as $$
  select (coalesce((select sum(amount) from public.arrow_events where user_id = p_user and paid), 0)
        - coalesce((select sum(cost) from public.user_rewards where user_id = p_user), 0))::int;
$$;

-- Échange : vérification du solde, dépense et avantage en une seule opération.
create or replace function public.redeem_reward(p_reward_id text) returns public.user_rewards
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  r public.rewards;
  p public.profiles;
  balance int;
  new_code text;
  result public.user_rewards;
begin
  if not public.arrow_is_student(me) then
    raise exception 'La boutique est réservée aux comptes étudiants.';
  end if;
  -- Même verrou que les votes : deux échanges simultanés ne dépensent pas deux fois le même solde.
  perform pg_advisory_xact_lock(hashtextextended('arrows-user:' || me, 0));
  select * into r from public.rewards where id = p_reward_id and active;
  if not found then
    raise exception 'Cette récompense n''est plus proposée.';
  end if;
  select * into p from public.profiles where id = me;
  if r.effect = 'golden_badge' and p.golden_badge then
    raise exception 'Tu as déjà le Badge Doré.';
  end if;
  if r.effect = 'early_access' and p.early_access_until > now() then
    raise exception 'Ton Accès Avant-Première est encore actif.';
  end if;
  balance := public.arrows_balance(me);
  if balance < r.cost then
    raise exception 'Flèches insuffisantes : il t''en manque %.', r.cost - balance;
  end if;

  if r.effect is null then
    -- Code aléatoire « SW-XXXXXX » ; on retire en cas de doublon.
    loop
      new_code := 'SW-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      exit when not exists (select 1 from public.user_rewards where code = new_code);
    end loop;
  end if;
  insert into public.user_rewards (user_id, reward_id, cost, code) values (me, r.id, r.cost, new_code)
    returning * into result;

  if r.effect = 'golden_badge' then
    update public.profiles set golden_badge = true where id = me;
  elsif r.effect = 'early_access' then
    update public.profiles set early_access_until = now() + interval '7 days' where id = me;
  end if;
  return result;
end $$;

-- « Marquer comme utilisé en caisse » : seulement ses bons commerçants, une seule fois.
create or replace function public.use_reward(p_id uuid) returns public.user_rewards
language plpgsql security definer set search_path = public as $$
declare
  result public.user_rewards;
begin
  update public.user_rewards u set used_at = now()
   where u.id = p_id and u.user_id = auth.uid() and u.used_at is null
     and exists (select 1 from public.rewards r where r.id = u.reward_id and r.category = 'local')
  returning * into result;
  if result.id is null then
    raise exception 'Ce bon est introuvable ou déjà utilisé.';
  end if;
  return result;
end $$;

-- Remplace la version de 016 : double compteur, avantages actifs et dépenses dans l'historique.
create or replace function public.my_arrows() returns json
language sql stable security definer set search_path = public as $$
  with earned as (
    select coalesce(sum(amount) filter (where paid), 0)::int as total,
           coalesce(sum(amount) filter (where not paid), 0)::int as pending,
           (count(*) filter (where kind in ('confirm', 'report')
              and public.arrow_day(created_at) = public.arrow_day(now())))::int as today_votes
    from public.arrow_events where user_id = auth.uid()
  )
  select json_build_object(
    'total', e.total,
    'total_arrows_earned', e.total,
    'current_arrows_balance', public.arrows_balance(auth.uid()),
    'pending', e.pending,
    'streak', public.arrow_streak(auth.uid(), public.arrow_day(now())),
    'today_votes', e.today_votes,
    'golden_badge', coalesce(p.golden_badge, false),
    'early_access_until', case when p.early_access_until > now() then p.early_access_until end,
    'history', coalesce((
      select json_agg(h order by h.created_at desc) from (
        select * from (
          select 'g' || a.id as id, a.kind, a.amount, a.multiplier, a.paid, a.created_at, d.title
          from public.arrow_events a left join public.deals d on d.id = a.deal_id
          where a.user_id = auth.uid()
          union all
          select 's' || u.id, 'spend', -u.cost, 1, true, u.created_at, r.title
          from public.user_rewards u join public.rewards r on r.id = u.reward_id
          where u.user_id = auth.uid()
        ) all_moves
        order by created_at desc, id desc limit 15
      ) h), '[]'::json)
  )
  from earned e left join public.profiles p on p.id = auth.uid();
$$;

revoke execute on function public.arrows_balance(uuid) from public, anon, authenticated;
revoke execute on function public.redeem_reward(text), public.use_reward(uuid), public.my_arrows() from public, anon;
grant execute on function public.redeem_reward(text), public.use_reward(uuid), public.my_arrows() to authenticated;

-- =====================================================================
-- Accès ouvert à tous, publications plafonnées (voir migrations/018_no_access_limit.sql)
-- =====================================================================
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

-- ShareWood — Flèches et localisation (à exécuter après 019_golden_badge_text.sql ; relançable sans risque).
-- Barème repris dans src/lib/arrows.ts (affichage) : le modifier aux deux endroits.
--
--                                    offre sur la carte          offre sans lieu précis
--   publier ......................... +50 (sur place)             +20
--   3 confirmations reçues .......... +30                         +10
--   « J'en ai profité » ............... +10 (sur place)             +3
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

-- ShareWood — « Plus dispo » se signale sur place (à exécuter après 020_location_rules.sql ; relançable sans risque).
-- Sur une offre placée sur la carte, le signalement n'est accepté qu'avec une position à 500 m au plus :
-- impossible d'archiver une offre depuis chez soi. Inchangé : « J'en ai profité » (permis partout, sans Flèches
-- loin ou sans position), les offres sans lieu précis, et le retrait de son propre signalement.

create or replace function public.require_presence_to_report() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  lat float8 := nullif(current_setting('arrows.lat', true), '')::float8;
  lng float8 := nullif(current_setting('arrows.lng', true), '')::float8;
  d public.deals;
begin
  -- Seules les écritures de l'application sont contrôlées (pas les scripts de démo du SQL Editor).
  if coalesce(current_setting('role', true), '') <> 'authenticated' or new.value <> -1 then return new; end if;
  select * into d from public.deals where id = new.deal_id;
  if d.lat is null or d.lng is null then return new; end if;
  -- La position, transmise par react_to_deal, sert seulement à ce contrôle : elle n'est pas enregistrée.
  if lat is null or lng is null then
    raise exception '« Plus dispo » se signale sur place : partage ta position (Profil, « Ma localisation ») et autorise-la dans le navigateur.';
  end if;
  if public.arrow_distance_m(lat, lng, d.lat, d.lng) > 500 then
    raise exception 'Tu es à plus de 500 m de l''offre : « Plus dispo » se signale sur place.';
  end if;
  return new;
end $$;

drop trigger if exists votes_presence on public.votes;
create trigger votes_presence before insert or update on public.votes
  for each row execute function public.require_presence_to_report();

revoke execute on function public.require_presence_to_report() from public, anon, authenticated;

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

-- ---------- 024 : offres issues d'une source officielle ----------
alter table public.deals add column if not exists source_name text;
alter table public.deals add column if not exists source_checked_at date;

-- Une source affichée doit toujours être consultable.
alter table public.deals drop constraint if exists deals_source_needs_link;
alter table public.deals add constraint deals_source_needs_link check (
  source_name is null
  or (char_length(source_name) between 1 and 80 and link_url is not null and source_checked_at is not null)
);
