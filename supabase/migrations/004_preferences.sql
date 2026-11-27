-- ShareWood — préférences des étudiants (à exécuter après 003_column_grants.sql ; relançable sans risque).
-- Les données personnelles (position, budget, transports…) vont dans une table à part, lisible par son
-- seul propriétaire : `profiles` est lisible par tous les utilisateurs connectés.

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
