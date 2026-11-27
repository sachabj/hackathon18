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
