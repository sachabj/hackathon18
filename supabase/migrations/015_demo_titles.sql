-- ShareWood — titres de démo sans « [Exemple] » (tâche 37 ; relançable sans risque, données seulement).
-- Pour les bases où reset_demo.sql a déjà été lancé. L'offre reste signalée comme fictive dans sa description
-- (visible dans la fiche) : ce sont des promos inventées sur de vrais commerces.
update public.deals
   set description = 'Exemple fictif (démo) : offre inventée.' || coalesce(' ' || nullif(description, ''), '')
 where title like '[Exemple]%'
   and coalesce(description, '') not like 'Exemple fictif%';

update public.deals
   set title = regexp_replace(title, '^\[Exemple\][[:space:]]*', '')
 where title like '[Exemple]%';
