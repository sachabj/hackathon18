-- ShareWood — conditions d'accès et lien d'un bon plan (à exécuter après 011 ; relançable sans risque).
-- 1. « Carte Sortir » n'est plus une catégorie mais une condition, comme la carte étudiante :
--    colonne deals.requirements (student_card | carte_sortir | scholarship | under_26).
--    Les bons plans « Carte Sortir » passent en « Activités » avec la condition carte_sortir.
--    La valeur reste dans le type deal_category (la retirer obligerait à recréer le type) mais est interdite.
-- 2. Lien vers l'offre : colonne deals.link_url (http/https seulement, 500 caractères max).
--    Les « Source : https://… » placés en fin de description deviennent ce lien.

alter table public.deals add column if not exists requirements text[] not null default '{}';
alter table public.deals add column if not exists link_url text;

alter table public.deals drop constraint if exists deals_requirements_check;
alter table public.deals add constraint deals_requirements_check
  check (requirements <@ array['student_card', 'carte_sortir', 'scholarship', 'under_26']::text[]);

alter table public.deals drop constraint if exists deals_link_url_check;
alter table public.deals add constraint deals_link_url_check
  check (link_url is null or (link_url ~* '^https?://[^[:space:]]+$' and char_length(link_url) <= 500));

-- Carte Sortir : catégorie → condition
update public.deals
   set category = 'activity',
       requirements = array(select distinct unnest(requirements || array['carte_sortir']))
 where category::text = 'carte_sortir';
update public.profiles
   set followed_categories = array_remove(followed_categories::text[], 'carte_sortir')::deal_category[]
 where 'carte_sortir' = any (followed_categories::text[]);

alter table public.deals drop constraint if exists deals_no_carte_sortir_category;
alter table public.deals add constraint deals_no_carte_sortir_category check (category::text <> 'carte_sortir');

-- « Source : https://… » en fin de description (un seul lien) → link_url
update public.deals
   set link_url = substring(description from '[[:space:]]*Source : (https?://[^[:space:]]+)[[:space:]]*$'),
       description = nullif(regexp_replace(description, '[[:space:]]*Source : https?://[^[:space:]]+[[:space:]]*$', ''), '')
 where link_url is null
   and char_length(substring(description from '[[:space:]]*Source : (https?://[^[:space:]]+)[[:space:]]*$')) <= 500;

-- Colonnes écrivables par l'auteur (voir 003_column_grants.sql)
grant insert (requirements, link_url), update (requirements, link_url) on public.deals to authenticated;
