-- ShareWood — offres issues d'une source officielle (tâche 65). Relançable sans risque.
-- `source_name` : d'où vient l'offre (badge « Source officielle ») ; `source_checked_at` : jour de la vérification.
-- Aucun droit d'écriture pour l'application : seules les requêtes du SQL Editor (import) peuvent les remplir.
alter table public.deals add column if not exists source_name text;
alter table public.deals add column if not exists source_checked_at date;

-- Une source affichée doit toujours être consultable.
alter table public.deals drop constraint if exists deals_source_needs_link;
alter table public.deals add constraint deals_source_needs_link check (
  source_name is null
  or (char_length(source_name) between 1 and 80 and link_url is not null and source_checked_at is not null)
);
