-- =====================================================================
-- Waze-Etu — schéma Supabase
-- À coller dans Supabase → SQL Editor → Run (une seule fois, sur un projet vide).
-- Toute modif : mettre à jour src/lib/types.ts et memory/ARCHITECTURE.md.
-- =====================================================================

-- ---------- Types ----------
create type deal_category as enum
  ('restaurant', 'supermarket', 'transport', 'scholarship', 'sport', 'carte_sortir', 'activity');
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
