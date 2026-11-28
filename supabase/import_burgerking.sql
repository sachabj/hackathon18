-- ShareWood — offre étudiante Burger King (tâche 65), vérifiée à la main le 28/11/2026 sur la page officielle.
-- À coller dans Supabase → SQL Editor → Run, APRÈS import_sources.sql (qui efface les offres importées auparavant :
-- relancer ce fichier ensuite). Relançable : l'offre n'est ajoutée qu'une fois.
do $bk$
declare
  bot uuid;
  page constant text := 'https://www.burgerking.fr/page/offre-etudiante';
begin
  select id into bot from auth.users where email = 'sources@example.com';
  if bot is null then
    raise exception 'Lance d''abord supabase/import_sources.sql.';
  end if;

  insert into public.deals (title, description, category, scope, requirements, link_url, source_name,
    source_checked_at, author_id)
  select 'Burger King étudiants : 2e burger identique à 2 €',
    'Un menu acheté = un deuxième burger identique pour 2 €. Pour les titulaires d''une carte étudiante (justificatif possible), membres du programme Kingdom avec le profil étudiant activé. Une fois par jour. Conditions sur la page officielle.',
    'restaurant', 'national', array['student_card']::text[], page, 'burgerking.fr', date '2026-11-28', bot
  where not exists (select 1 from public.deals where author_id = bot and link_url = page);
end $bk$;

select title, source_name from public.deals where source_name = 'burgerking.fr';
