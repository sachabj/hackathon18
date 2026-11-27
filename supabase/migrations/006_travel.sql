-- ShareWood — voyages et retours chez les parents (à exécuter après 004_preferences.sql ; relançable sans risque).
-- Colonnes de la table privée `preferences` : mêmes droits (propriétaire seul), aucun GRANT à ajouter.
alter table public.preferences add column if not exists home_visits text
  check (home_visits in ('often', 'sometimes', 'never'));
alter table public.preferences add column if not exists wants_travel boolean;
alter table public.preferences add column if not exists travel_modes text[] not null default '{}';
