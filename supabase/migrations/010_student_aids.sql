-- ShareWood — aides : « Boursier ? » et « Carte Sortir ? » (à exécuter après 004_preferences.sql ; relançable sans risque).
-- Réponses facultatives, dans la table privée `preferences` (propriétaire seul) : aucun GRANT à ajouter.
-- Elles décident si les bourses et les offres Carte Sortir apparaissent dans « Pour toi ».
alter table public.preferences add column if not exists is_scholarship boolean;
alter table public.preferences add column if not exists has_carte_sortir boolean;
