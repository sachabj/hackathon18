-- =====================================================================
-- ShareWood — remise à zéro de la base + données de démo. ⚠️ SUPPRESSION DÉFINITIVE.
-- Prérequis : migrations 004 à 012 appliquées (012 : colonnes requirements et link_url). À coller dans Supabase → SQL Editor → Run.
--
-- 1. Remplir ci-dessous les comptes à GARDER et le mot de passe des comptes de démo
--    (ne jamais committer ces valeurs : le dépôt est public).
-- 2. Tout compte absent de la liste est effacé, avec ses bons plans, votes, favoris et commerce.
--    Une adresse de la liste sans compte est ignorée (la personne pourra s'inscrire plus tard) et affichée
--    à la fin. ⚠️ Vérifie l'orthographe : une faute de frappe efface le vrai compte. Pour comparer avant :
--    select email from auth.users order by email;
-- Le script est « tout ou rien » : à la moindre erreur, rien n'est modifié. Relançable.
--
-- Données : offre avec un lien (link_url) = offre trouvée sur le web le 27/11/2026 (prix à revérifier avant la démo).
--           Description « Exemple fictif (démo) … » = offre INVENTÉE sur un lieu réel, à ne pas présenter comme vraie
--           (mention visible dans la fiche ; « [Exemple] » n'est plus dans le titre depuis la tâche 37).
-- Lieux : © les contributeurs d'OpenStreetMap (ODbL). Comptes de démo (même mot de passe) :
--   étudiants demo.<prénom>@example.com · commerçants demo.commerce1@example.com à demo.commerce12@example.com.
-- Les offres « officielles » appartiennent toutes à des commerces FICTIFS, marqués « (démo) ».
-- =====================================================================
do $reset$
declare
  keep text[] := array[
    'EMAIL_A_GARDER_1',
    'EMAIL_A_GARDER_2'
  ];
  demo_password text := 'CHOISIR_UN_MOT_DE_PASSE';
  u record;
  new_id uuid;
begin
  -- ---------- Garde-fous ----------
  if demo_password = 'CHOISIR_UN_MOT_DE_PASSE' or length(demo_password) < 8 then
    raise exception 'Choisis un mot de passe de démo (8 caractères minimum) en haut du script.';
  end if;
  if exists (select 1 from unnest(keep) k where k like 'EMAIL_A_GARDER%') then
    raise exception 'Remplace les EMAIL_A_GARDER en haut du script par les adresses à conserver.';
  end if;
  if to_regclass('public.deal_views') is null then
    raise exception 'Lance d''abord supabase/migrations/007_engagement.sql.';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'deals' and column_name = 'link_url') then
    raise exception 'Lance d''abord supabase/migrations/012_requirements_links.sql (et 010 si besoin).';
  end if;

  -- Bilan des comptes de la liste, établi avant la suppression et affiché à la fin.
  drop table if exists reset_report;
  create temporary table reset_report as
  select k as compte_a_garder,
    case when exists (select 1 from auth.users a where lower(a.email) = lower(trim(k)))
      then 'conservé' else 'pas encore de compte (ignoré)' end as etat
  from unnest(keep) k;

  -- ---------- Nettoyage ----------
  -- Depuis la migration 009, supprimer un compte ne supprime plus ses bons plans : on les efface d'abord
  -- (ainsi que les bons plans restés sans auteur).
  delete from public.deals d
   where d.author_id is null or d.author_id in (
     select a.id from auth.users a
      where not exists (select 1 from unnest(keep) k where lower(trim(k)) = lower(a.email)));
  delete from auth.users a
   where not exists (select 1 from unnest(keep) k where lower(trim(k)) = lower(a.email));
  delete from public.deals where description like 'Exemple fictif (démo)%'; -- exemples de l'ancien jeu de données (seed_demo.sql, supprimé)

  -- ---------- Étudiants de démo ----------
  for u in
    select * from (values
      ('demo.lea@example.com', 'Léa (démo)', 'ker-lann', '{restaurant,supermarket,activity}', '{walk,bike}', 'tight', '{cinema,games}', 'sometimes', '{train}', false, false),
      ('demo.hugo@example.com', 'Hugo (démo)', 'ker-lann', '{transport,restaurant,sport}', '{bus}', 'balanced', '{team_sport,nightlife}', 'often', '{train,carpool}', false, false),
      ('demo.ines@example.com', 'Inès (démo)', 'bruz', '{activity,restaurant}', '{bike}', 'tight', '{culture,music}', 'sometimes', '{train,bus}', true, false),
      ('demo.malo@example.com', 'Malo (démo)', 'bruz', '{supermarket,restaurant,transport}', '{car}', 'balanced', '{fitness,outdoor}', 'often', '{carpool}', false, false),
      ('demo.sarah@example.com', 'Sarah (démo)', 'rennes', '{activity,transport}', '{bus,walk}', 'comfort', '{cinema,culture}', 'never', '{plane,train}', false, true),
      ('demo.yanis@example.com', 'Yanis (démo)', 'rennes', '{transport,supermarket}', '{bus}', 'tight', '{games,swimming}', 'sometimes', '{bus}', true, false),
      ('demo.chloe@example.com', 'Chloé (démo)', 'ker-lann', '{sport,activity,restaurant}', '{bike,walk}', 'balanced', '{fitness,swimming}', 'sometimes', '{train}', false, false),
      ('demo.tom@example.com', 'Tom (démo)', 'bruz', '{restaurant,activity,supermarket}', '{train}', 'comfort', '{music,nightlife}', 'often', '{train}', false, false),
      ('demo.nolan@example.com', 'Nolan (démo)', 'bruz', '{restaurant,sport}', '{bike}', 'tight', '{team_sport,games}', 'sometimes', '{train}', true, false),
      ('demo.camille@example.com', 'Camille (démo)', 'rennes', '{activity,restaurant}', '{bus}', 'balanced', '{culture,cinema}', 'often', '{train}', false, false),
      ('demo.maelle@example.com', 'Maëlle (démo)', 'ker-lann', '{supermarket,restaurant}', '{walk}', 'tight', '{cinema,music}', 'sometimes', '{carpool}', true, true),
      ('demo.enzo@example.com', 'Enzo (démo)', 'rennes', '{sport,restaurant}', '{bike}', 'balanced', '{fitness,team_sport}', 'never', '{bus}', false, false),
      ('demo.jade@example.com', 'Jade (démo)', 'bruz', '{activity,supermarket}', '{car}', 'comfort', '{outdoor,swimming}', 'often', '{train,plane}', false, false),
      ('demo.lucas@example.com', 'Lucas (démo)', 'ker-lann', '{restaurant,transport}', '{bus}', 'balanced', '{games,nightlife}', 'often', '{train,carpool}', false, false),
      ('demo.manon@example.com', 'Manon (démo)', 'rennes', '{supermarket,activity}', '{walk,bus}', 'tight', '{culture,music}', 'sometimes', '{bus}', true, false),
      ('demo.theo@example.com', 'Théo (démo)', 'bruz', '{sport,activity}', '{bike,car}', 'balanced', '{outdoor,fitness}', 'sometimes', '{carpool}', false, false),
      ('demo.zoe@example.com', 'Zoé (démo)', 'ker-lann', '{activity,restaurant}', '{bike}', 'comfort', '{cinema,games}', 'sometimes', '{train}', false, false),
      ('demo.gabin@example.com', 'Gabin (démo)', 'rennes', '{restaurant,supermarket}', '{bus}', 'tight', '{nightlife,music}', 'never', '{train}', false, true),
      ('demo.louise@example.com', 'Louise (démo)', 'bruz', '{restaurant,sport,activity}', '{walk}', 'balanced', '{swimming,fitness}', 'often', '{train}', false, false),
      ('demo.noah@example.com', 'Noah (démo)', 'ker-lann', '{transport,supermarket}', '{car,carpool}', 'balanced', '{games,outdoor}', 'often', '{carpool,plane}', false, false)
    ) as s(email, username, zone, categories, transports, budget, activities, home_visits, travel, scholar, sortir)
  loop
    new_id := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', u.email,
      extensions.crypt(demo_password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('username', u.username, 'account_type', 'student'),
      now(), now(), '', '', '', '');
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (new_id::text, new_id, jsonb_build_object('sub', new_id::text, 'email', u.email, 'email_verified', true),
      'email', now(), now(), now());
    -- Le profil est créé par le trigger d'inscription : on le complète.
    update public.profiles set onboarded = true, followed_categories = u.categories::deal_category[],
      followed_zone_ids = array[u.zone] where id = new_id;
    insert into public.preferences (user_id, home_zone_id, transport_modes, budget_profile, activities,
      home_visits, travel_modes, is_scholarship, has_carte_sortir)
    values (new_id, u.zone, u.transports::text[], u.budget, u.activities::text[],
      u.home_visits, u.travel::text[], u.scholar, u.sortir);
  end loop;

  -- ---------- Commerçants de démo (commerces FICTIFS : aucun vrai commerce n'a de compte) ----------
  for u in
    select * from (values
      ('demo.commerce1@example.com', 'Café des Étangs (démo)', 'Bruz', 'restaurant', 'bruz', 48.02400, -1.74640),
      ('demo.commerce2@example.com', 'Crêperie du Clocher (démo)', 'Chartres-de-Bretagne', 'restaurant', 'ker-lann', 48.04471, -1.70931),
      ('demo.commerce3@example.com', 'Cantine Verte (démo)', 'Saint-Jacques-de-la-Lande', 'restaurant', 'rennes', 48.08326, -1.70942),
      ('demo.commerce4@example.com', 'Pizzeria des Deux Rives (démo)', 'Guichen', 'restaurant', 'bruz', 47.96450, -1.79607),
      ('demo.commerce5@example.com', 'Épicerie du Bocage (démo)', 'Laillé', 'supermarket', 'bruz', 47.97812, -1.71750),
      ('demo.commerce6@example.com', 'Panier Malin (démo)', 'Chavagne', 'supermarket', 'ker-lann', 48.05381, -1.79153),
      ('demo.commerce7@example.com', 'Marché des Halles Vertes (démo)', 'Le Rheu', 'supermarket', null, 48.09914, -1.79365),
      ('demo.commerce8@example.com', 'Atelier Grimpe (démo)', 'Vern-sur-Seiche', 'sport', 'rennes', 48.04877, -1.60554),
      ('demo.commerce9@example.com', 'Studio Forme (démo)', 'Mordelles', 'sport', null, 48.07118, -1.85103),
      ('demo.commerce10@example.com', 'Ciné Lanterne (démo)', 'Pont-Péan', 'activity', 'bruz', 48.01629, -1.70814),
      ('demo.commerce11@example.com', 'La Fabrique à Jeux (démo)', 'Rennes', 'activity', 'rennes', 48.08850, -1.67900),
      ('demo.commerce12@example.com', 'Escale Culture (démo)', 'Noyal-Châtillon-sur-Seiche', 'activity', 'ker-lann', 48.04074, -1.66105)
    ) as s(email, name, town, category, zone, lat, lng)
  loop
    new_id := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', u.email,
      extensions.crypt(demo_password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('username', u.name, 'account_type', 'merchant'),
      now(), now(), '', '', '', '');
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (new_id::text, new_id, jsonb_build_object('sub', new_id::text, 'email', u.email, 'email_verified', true),
      'email', now(), now(), now());
    update public.profiles set role = 'merchant' where id = new_id;
    insert into public.businesses (owner_id, name, address, category, zone_id, lat, lng)
    values (new_id, u.name, u.town, u.category::deal_category, u.zone, u.lat, u.lng);
  end loop;

  -- ---------- Bons plans ----------
  insert into public.deals (title, description, category, subcategory, scope, zone_id, place_name, lat, lng,
    price_info, price_level, tags, expires_at, deadline_at, author_id, created_at, requirements, link_url)
  select v.title, v.description, v.category::deal_category, v.subcategory::deal_subcategory, v.scope::deal_scope,
    v.zone_id, v.place_name, v.lat::double precision, v.lng::double precision, v.price_info, v.price_level,
    v.tags::text[], v.expires_at::timestamptz, v.deadline_at::timestamptz, p.id,
    now() - make_interval(hours => v.age_hours), v.requirements::text[], v.link_url
  from (values
    -- ===== Offres sourcées =====
    ('Repas Crous à 1 € pour tous les étudiants',
     'Plat + 2 périphériques avec un compte Izly actif. Resto U'' ouvert du lundi au vendredi, 11h30-13h45.',
     'restaurant', null, 'local', 'ker-lann', 'Resto U'' Ker Lann, campus de Ker Lann', 48.04659, -1.74174, '1 €', 1, '{}', null, null, 'demo.lea@example.com', 70, '{student_card}', 'https://www.crous-rennes.fr/restaurant/resto-u-ker-lann-3/'),
    ('Ciné à 7,80 € en tarif étudiant',
     'Sur justificatif, hors supplément 3D.',
     'activity', null, 'local', 'bruz', 'Cinéville Bruz, 15 avenue de Cézembre', 48.02913, -1.75317, '7,80 €', 1, '{cinema}', null, null, 'demo.tom@example.com', 52, '{student_card}', 'https://bruz.cineville.fr/tarifs/4037'),
    ('Moins de 26 ans : la séance de ciné à 6 €',
     'Carte CinéLiberté -26 ans : 6 € la séance, adhésion de 12 € par an.',
     'activity', null, 'local', 'bruz', 'Cinéville Bruz, 15 avenue de Cézembre', 48.02920, -1.75290, '6 € la séance', 1, '{cinema}', null, null, 'demo.ines@example.com', 30, '{under_26}', 'https://bruz.cineville.fr/tarifs/4037'),
    ('Spectacles à 9 € pour les étudiants',
     'Saison 2026-2027, toutes catégories, avec la carte étudiante de l''année.',
     'activity', null, 'local', 'bruz', 'Le Grand Logis, 10 avenue du Général de Gaulle', 48.02282, -1.74485, '9 €', 1, '{culture,music}', null, null, 'demo.ines@example.com', 96, '{student_card}', 'https://legrandlogis-bruz.fr/tarifs-abonnements/tarifs/'),
    ('Carte Sortir ! : spectacles à 4 €',
     'Tarif Sortir ! toutes catégories, saison 2026-2027.',
     'activity', null, 'local', 'bruz', 'Le Grand Logis, 10 avenue du Général de Gaulle', 48.02270, -1.74510, '4 €', 1, '{culture}', null, null, 'demo.sarah@example.com', 44, '{carte_sortir}', 'https://legrandlogis-bruz.fr/tarifs-abonnements/tarifs/'),
    ('Cinéma Arvor : 7,20 € pour les étudiants',
     'Tarifs 2026, sur justificatif.',
     'activity', null, 'local', 'rennes', 'Cinéma Arvor, 11 rue de Châtillon', 48.10234, -1.67445, '7,20 €', 1, '{cinema,culture}', null, null, 'demo.sarah@example.com', 60, '{student_card}', 'https://www.cinema-arvor.fr/tarifs/'),
    ('Expos gratuites au musée des Beaux-Arts',
     'Expositions temporaires gratuites pour les moins de 26 ans et les étudiants ; collections gratuites pour tous. Du mardi au dimanche, 10h-18h.',
     'activity', null, 'local', 'rennes', 'Musée des Beaux-Arts, 20 quai Émile Zola', 48.10962, -1.67494, 'Gratuit', 0, '{culture}', null, null, 'demo.yanis@example.com', 28, '{}', 'https://mba.rennes.fr/infos-pratiques/horaires-acces-tarifs'),
    ('STAR : forfait étudiant à 19,95 €/mois',
     'Bus, métro et vélos illimités, 239,40 € sur 12 mois. 18-26 ans habitant Rennes Métropole.',
     'transport', 'bus', 'zone', 'rennes', null, null, null, '19,95 €/mois', 2, '{}', null, null, 'demo.yanis@example.com', 120, '{student_card}', 'https://www.star.fr/star-et-moi/parent-eleve-etudiant/tarifs-etudiants'),
    ('Boursiers : transports STAR jusqu''à la gratuité',
     '-50 % à l''échelon 2, -85 % aux échelons 3 et 4, gratuit des échelons 5 à 7 (Rennes Métropole, demande en ligne).',
     'transport', 'bus', 'zone', 'rennes', null, null, null, 'dès 0 €', 0, '{}', null, null, 'demo.yanis@example.com', 80, '{scholarship}', 'https://www.star.fr/star-et-moi/parent-eleve-etudiant/tarifs-etudiants'),
    ('Unipass : STAR + TER pour les moins de 27 ans',
     '12 € la semaine ou 27 € le mois.',
     'transport', 'train', 'zone', 'bruz', null, null, null, '27 €/mois', 3, '{}', null, null, 'demo.malo@example.com', 40, '{}', 'https://www.star.fr/star-et-moi/parent-eleve-etudiant/tarifs-etudiants'),
    ('TER BreizhGo -26 ans : billets dès 4 €',
     'Prix fixes selon la distance pour les moins de 26 ans.',
     'transport', 'train', 'zone', 'rennes', null, null, null, 'dès 4 €', 1, '{}', null, null, 'demo.hugo@example.com', 55, '{under_26}', 'https://www.ter.sncf.com/bretagne/tarifs-cartes/billets-moins-26-ans/voyage-ter-breizhgo-moins-26'),
    ('Carte Avantage Jeune SNCF : -30 % sur le train',
     '49 € pour un an, de 12 à 27 ans, réduction surtout sur TGV INOUI et Intercités.',
     'transport', 'train', 'national', null, null, null, null, '49 € / an', 3, '{}', null, null, 'demo.hugo@example.com', 100, '{}', 'https://www.sncf-connect.com/bons-plans/cartes-avantage'),
    ('Pass''Sport : 50 € pour les boursiers',
     'Moins de 28 ans avec une bourse attribuée avant le 15/10/2026 ; à utiliser avant le 31/12/2026.',
     'sport', null, 'national', null, null, null, null, '-50 €', 0, '{team_sport,fitness}', '2026-12-31 23:59:59+01', '2026-12-31 23:59:59+01', 'demo.chloe@example.com', 36, '{scholarship}', 'https://www.service-public.gouv.fr/particuliers/actualites/A14916'),
    ('Bourse 2026-2027 : dépôt tardif possible jusqu''au 31/12',
     'Après le 31 mai le dossier (DSE) n''est plus prioritaire, mais reste accepté jusqu''au 31 décembre 2026.',
     'scholarship', null, 'national', null, null, null, null, 'Gratuit', 0, '{}', '2026-12-31 23:59:59+01', '2026-12-31 23:59:59+01', 'demo.ines@example.com', 26, '{}', 'https://www.etudiant.gouv.fr/fr/bourse-et-logement-etudiant-constituez-votre-dossier-social-etudiant-dse-409'),
    -- ===== Exemples inventés sur des lieux réels =====
    ('Pâtes à -50 %', 'Exemple fictif (démo) : offre inventée.',
     'supermarket', null, 'local', 'bruz', 'Intermarché, 2 place du Vert Buisson', 48.02918, -1.76081, '0,89 €', 1, '{}', null, null, 'demo.malo@example.com', 6, '{}', null),
    ('Panier fruits et légumes à 4 €', 'Exemple fictif (démo) : offre inventée.',
     'supermarket', null, 'local', 'bruz', 'Super U, Bruz', 48.02196, -1.74369, '4 €', 1, '{}', null, null, 'demo.lea@example.com', 27, '{}', null),
    ('-10 % étudiants le mercredi', 'Exemple fictif (démo) : offre inventée.',
     'supermarket', null, 'local', 'bruz', 'Carrefour City, 9 place du Docteur Joly', 48.02402, -1.74671, '-10 %', 1, '{}', null, null, 'demo.malo@example.com', 50, '{student_card}', null),
    ('Menu étudiant à 6,50 €', 'Exemple fictif (démo) : offre inventée.',
     'restaurant', null, 'local', 'ker-lann', 'McDonald''s, Ker Lann', 48.05573, -1.73974, '6,50 €', 1, '{}', null, null, 'demo.hugo@example.com', 4, '{}', null),
    ('Boisson offerte avec un sandwich', 'Exemple fictif (démo) : offre inventée.',
     'restaurant', null, 'local', 'ker-lann', 'Subway, Ker Lann', 48.04595, -1.74141, 'dès 5 €', 1, '{}', null, null, 'demo.chloe@example.com', 31, '{}', null),
    ('Invendus du soir à moitié prix', 'Exemple fictif (démo) : offre inventée.',
     'restaurant', null, 'local', 'bruz', 'La Fournée Bruzoise', 48.02399, -1.74691, '-50 %', 1, '{}', null, null, 'demo.tom@example.com', 2, '{}', null),
    ('2 pizzas achetées, la 3e offerte', 'Exemple fictif (démo) : offre inventée.',
     'restaurant', null, 'local', 'bruz', 'Pizza Chouchou', 48.02405, -1.74620, 'dès 9 €', 1, '{}', null, null, 'demo.tom@example.com', 75, '{}', null),
    ('Premier mois de salle offert', 'Exemple fictif (démo) : offre inventée.',
     'sport', null, 'local', 'bruz', 'Giga Fit, Bruz', 48.02211, -1.74304, '1er mois offert', 2, '{fitness}', null, null, 'demo.chloe@example.com', 48, '{}', null),
    ('Covoiturage Bruz → Rennes le vendredi', 'Exemple fictif (démo) : trajet inventé.',
     'transport', 'carpool', 'zone', 'bruz', null, null, null, '2 €', 1, '{}', null, null, 'demo.malo@example.com', 8, '{}', null)
  ) as v(title, description, category, subcategory, scope, zone_id, place_name, lat, lng, price_info, price_level,
         tags, expires_at, deadline_at, author, age_hours, requirements, link_url)
  join auth.users a on a.email = v.author
  join public.profiles p on p.id = a.id;

  -- ---------- Exemples répartis à 15 km autour de Bruz (offres inventées ; lieux : © OpenStreetMap, ODbL) ----------
  insert into public.deals (title, description, category, scope, zone_id, place_name, lat, lng, price_info, price_level,
    tags, expires_at, author_id, created_at, requirements, is_official, boosted_until)
  select v.title, 'Exemple fictif (démo) : offre inventée.', v.category::deal_category, 'local', v.zone_id, v.place_name,
    v.lat, v.lng, v.price_info, v.price_level, v.tags::text[], now() + make_interval(days => v.expires_in::int),
    p.id, now() - make_interval(hours => v.age_hours), v.requirements::text[], v.official,
    case when v.boosted then now() + interval '7 days' end
  from (values
    ('Menu étudiant à 7,50 €', 'restaurant', 'ker-lann', 'Restaurant La Taverne Bruzoise, Chartres-de-Bretagne', 48.05773, -1.73716, '7,50 €', 1, '{}', 5, 'demo.lea@example.com', 20, '{student_card}', false, false),
    ('-15 % sur l''addition le midi', 'restaurant', 'rennes', 'La P''tite Flambée, Chantepie', 48.10536, -1.62843, '-15 %', 2, '{}', 5, 'demo.hugo@example.com', 153, '{student_card}', false, false),
    ('Plat du jour à 8 €', 'restaurant', null, 'Mr Vagabond, Bourgbarré', 47.99330, -1.61344, '8 €', 1, '{}', 40, 'demo.ines@example.com', 157, '{}', false, false),
    ('Happy hour étudiant jusqu''à 21 h', 'restaurant', 'bruz', 'Le Bistrot de Lesnelay, Chavagne', 48.03719, -1.78990, '-30 %', 1, '{nightlife}', 21, 'demo.malo@example.com', 149, '{student_card}', false, false),
    ('Menu étudiant à 6,90 €', 'restaurant', 'bruz', 'Pizza Chouchou, Bruz', 48.02399, -1.74643, '6,90 €', 1, '{}', null, 'demo.sarah@example.com', 29, '{student_card}', false, false),
    ('Dessert offert avec un plat', 'restaurant', 'bruz', 'Récolte, Bruz', 48.02387, -1.74732, 'dès 11 €', 2, '{}', 12, 'demo.yanis@example.com', 74, '{}', false, false),
    ('Soirée jeux, softs à 2 €', 'restaurant', 'bruz', 'Le Cercle, Orgères', 47.99651, -1.66921, '2 €', 1, '{games,nightlife}', 12, 'demo.chloe@example.com', 2, '{}', false, false),
    ('Menu étudiant à 7,50 €', 'restaurant', null, 'L''Encas, Crevin', 47.93357, -1.66725, '7,50 €', 1, '{}', 5, 'demo.tom@example.com', 96, '{student_card}', false, false),
    ('Boisson offerte avec un menu', 'restaurant', 'bruz', 'Tandoori Food, Bruz', 48.02245, -1.74441, 'dès 7 €', 1, '{}', null, 'demo.nolan@example.com', 151, '{}', false, false),
    ('-15 % sur l''addition le midi', 'restaurant', 'ker-lann', 'Auberge de la Table Ronde, Le Rheu', 48.09469, -1.77161, '-15 %', 2, '{}', 40, 'demo.camille@example.com', 86, '{student_card}', false, false),
    ('Plat du jour à 8 €', 'restaurant', 'bruz', 'Cantine municipale scolaire, Laillé', 47.97978, -1.71561, '8 €', 1, '{}', null, 'demo.maelle@example.com', 45, '{}', false, false),
    ('Dessert offert avec un plat', 'restaurant', 'bruz', 'Pizza di Mozza, Pont-Péan', 48.01325, -1.70320, 'dès 11 €', 2, '{}', null, 'demo.enzo@example.com', 63, '{}', false, false),
    ('Concert à entrée libre le jeudi', 'restaurant', null, 'Le Baranoux, Saint-Senoux', 47.90518, -1.78717, 'Gratuit', 0, '{music,nightlife}', 40, 'demo.jade@example.com', 6, '{}', false, false),
    ('Happy hour étudiant jusqu''à 21 h', 'restaurant', 'bruz', 'Café le Paddock, Guichen', 47.96664, -1.79442, '-30 %', 1, '{nightlife}', 21, 'demo.lucas@example.com', 138, '{student_card}', false, false),
    ('Menu étudiant à 7,50 €', 'restaurant', 'ker-lann', 'La Befana, Noyal-Châtillon-sur-Seiche', 48.04265, -1.66220, '7,50 €', 1, '{}', 12, 'demo.manon@example.com', 118, '{student_card}', false, false),
    ('-15 % sur l''addition le midi', 'restaurant', 'bruz', 'Aux Berges du Lac, Chavagne', 48.04061, -1.80042, '-15 %', 2, '{}', null, 'demo.theo@example.com', 54, '{student_card}', false, false),
    ('Café et viennoiserie à 2,50 €', 'restaurant', 'bruz', 'Café des Sports, Goven', 48.00598, -1.84741, '2,50 €', 1, '{}', 12, 'demo.zoe@example.com', 64, '{}', false, false),
    ('Plat du jour à 8 €', 'restaurant', 'ker-lann', 'La Bulle, Bruz', 48.04069, -1.75470, '8 €', 1, '{}', 12, 'demo.gabin@example.com', 146, '{}', false, false),
    ('Dessert offert avec un plat', 'restaurant', 'rennes', 'Marius, Saint-Jacques-de-la-Lande', 48.08903, -1.70581, 'dès 11 €', 2, '{}', 5, 'demo.louise@example.com', 9, '{}', false, false),
    ('Menu étudiant à 7,50 €', 'restaurant', 'ker-lann', 'La Tuile, Chartres-de-Bretagne', 48.04145, -1.70614, '7,50 €', 1, '{}', 40, 'demo.noah@example.com', 95, '{student_card}', false, false),
    ('-15 % sur l''addition le midi', 'restaurant', null, 'Chez Enzo, Lassy', 47.97908, -1.87037, '-15 %', 2, '{}', null, 'demo.lea@example.com', 47, '{student_card}', false, false),
    ('Plat du jour à 8 €', 'restaurant', 'rennes', 'Cantine collège Saint-Gabriel, Pacé', 48.15324, -1.77226, '8 €', 1, '{}', 5, 'demo.hugo@example.com', 94, '{}', false, false),
    ('Dessert offert avec un plat', 'restaurant', null, 'Les P''tites Canailles, Mordelles', 48.07209, -1.85006, 'dès 11 €', 2, '{}', null, 'demo.ines@example.com', 107, '{}', false, false),
    ('Menu étudiant à 7,50 €', 'restaurant', 'rennes', 'L''Os ou L''Arête, Rennes', 48.11189, -1.67600, '7,50 €', 1, '{}', 12, 'demo.malo@example.com', 75, '{student_card}', false, false),
    ('-15 % sur l''addition le midi', 'restaurant', 'ker-lann', 'Restaurant d''application, Bruz', 48.04316, -1.74413, '-15 %', 2, '{}', null, 'demo.sarah@example.com', 9, '{student_card}', false, false),
    ('Plat du jour à 8 €', 'restaurant', 'rennes', 'Le Coin du Monde, Rennes', 48.09237, -1.67574, '8 €', 1, '{}', null, 'demo.yanis@example.com', 61, '{}', false, false),
    ('Dessert offert avec un plat', 'restaurant', null, 'Subito, Bourgbarré', 47.99550, -1.61365, 'dès 11 €', 2, '{}', 12, 'demo.chloe@example.com', 79, '{}', false, false),
    ('2 tacos achetés, le 3e offert', 'restaurant', 'bruz', 'Ethnic Food, Bruz', 48.02596, -1.74841, 'dès 12 €', 2, '{}', 21, 'demo.tom@example.com', 38, '{}', false, false),
    ('Menu étudiant à 7,50 €', 'restaurant', 'bruz', 'Crêperie du Moulin, Pont-Réan', 47.99276, -1.75577, '7,50 €', 1, '{}', 12, 'demo.nolan@example.com', 78, '{student_card}', false, false),
    ('Formule révisions : boisson à volonté', 'restaurant', 'bruz', 'Ty Spoon, Bruz', 48.02382, -1.74823, '4 €', 1, '{}', null, 'demo.camille@example.com', 114, '{student_card}', false, false),
    ('-15 % sur l''addition le midi', 'restaurant', 'bruz', 'Aux Saveurs de Marie, Orgères', 47.99573, -1.66927, '-15 %', 2, '{}', 12, 'demo.maelle@example.com', 14, '{student_card}', false, false),
    ('Soirée jeux, softs à 2 €', 'restaurant', null, 'Chez Béa, Crevin', 47.93730, -1.66353, '2 €', 1, '{games,nightlife}', 21, 'demo.enzo@example.com', 49, '{}', false, false),
    ('Plat du jour à 8 €', 'restaurant', 'bruz', 'Bar à crêpes Awena, Bruz', 48.02247, -1.74447, '8 €', 1, '{}', 5, 'demo.jade@example.com', 29, '{}', false, false),
    ('Dessert offert avec un plat', 'restaurant', 'ker-lann', 'BeerZone, Le Rheu', 48.08910, -1.78549, 'dès 11 €', 2, '{}', 5, 'demo.lucas@example.com', 89, '{}', false, false),
    ('Concert à entrée libre le jeudi', 'restaurant', 'bruz', 'Le Comptoir, Laillé', 47.97834, -1.71614, 'Gratuit', 0, '{music,nightlife}', 21, 'demo.manon@example.com', 66, '{}', false, false),
    ('Menu étudiant à 7,50 €', 'restaurant', 'bruz', 'Le pain de sucre, Bruz', 48.02274, -1.74325, '7,50 €', 1, '{}', 40, 'demo.theo@example.com', 118, '{student_card}', false, false),
    ('Happy hour étudiant jusqu''à 21 h', 'restaurant', null, 'Le Pendragon, Pléchâtel', 47.89451, -1.75001, '-30 %', 1, '{nightlife}', 5, 'demo.zoe@example.com', 20, '{student_card}', false, false),
    ('-15 % sur l''addition le midi', 'restaurant', 'bruz', 'PointGrill, Guichen', 47.96774, -1.79618, '-15 %', 2, '{}', null, 'demo.gabin@example.com', 44, '{student_card}', false, false),
    ('Soirée jeux, softs à 2 €', 'restaurant', 'ker-lann', 'Le Flyse, Noyal-Châtillon-sur-Seiche', 48.04207, -1.66675, '2 €', 1, '{games,nightlife}', null, 'demo.louise@example.com', 134, '{}', false, false),
    ('Plat du jour à 8 €', 'restaurant', 'ker-lann', 'Pizzami''s, Chavagne', 48.05277, -1.78907, '8 €', 1, '{}', 5, 'demo.noah@example.com', 110, '{}', false, false),
    ('Formule midi sandwich + boisson', 'supermarket', 'rennes', 'Boulangerie Lévêque, Rennes', 48.09354, -1.67210, '5,20 €', 1, '{}', 21, 'demo.lea@example.com', 153, '{}', false, false),
    ('Viennoiseries à -50 % en fin de journée', 'supermarket', 'bruz', 'Maison Ruault, Goven', 48.00625, -1.84812, '-50 %', 1, '{}', 21, 'demo.hugo@example.com', 93, '{}', false, false),
    ('Pain de la veille à moitié prix', 'supermarket', 'rennes', 'Boulangerie Pasquier, Rennes', 48.09731, -1.67474, '-50 %', 1, '{}', 21, 'demo.ines@example.com', 9, '{}', false, false),
    ('Formule midi sandwich + boisson', 'supermarket', 'rennes', 'Gaby Respire, Vezin-le-Coquet', 48.11911, -1.75423, '5,20 €', 1, '{}', 12, 'demo.malo@example.com', 57, '{}', false, false),
    ('Viennoiseries à -50 % en fin de journée', 'supermarket', 'ker-lann', 'Les délices d''Erwann, Chartres-de-Bretagne', 48.04224, -1.70557, '-50 %', 1, '{}', null, 'demo.sarah@example.com', 83, '{}', false, false),
    ('Cagette de fruits et légumes à 4 €', 'supermarket', 'ker-lann', 'Le Rheu Maraîchers, Le Rheu', 48.08514, -1.75857, '4 €', 1, '{}', null, 'demo.yanis@example.com', 26, '{}', false, false),
    ('Pâtes et riz à -30 %', 'supermarket', null, 'Bio Morel, Mordelles', 48.08147, -1.82875, '-30 %', 1, '{}', null, 'demo.chloe@example.com', 127, '{}', false, false),
    ('Pain de la veille à moitié prix', 'supermarket', 'rennes', 'L''instant gourmand, Rennes', 48.10057, -1.70543, '-50 %', 1, '{}', null, 'demo.tom@example.com', 132, '{}', false, false),
    ('Formule midi sandwich + boisson', 'supermarket', 'bruz', 'Artisan boulanger saveurs d''antan, Orgères', 47.99577, -1.66815, '5,20 €', 1, '{}', 12, 'demo.nolan@example.com', 6, '{}', false, false),
    ('Viennoiseries à -50 % en fin de journée', 'supermarket', null, 'Péniguel, Chanteloup', 47.96697, -1.61621, '-50 %', 1, '{}', 5, 'demo.camille@example.com', 143, '{}', false, false),
    ('Pain de la veille à moitié prix', 'supermarket', null, 'Boulangerie Banette, Guignen', 47.91931, -1.86082, '-50 %', 1, '{}', 5, 'demo.maelle@example.com', 42, '{}', false, false),
    ('Formule midi sandwich + boisson', 'supermarket', 'bruz', 'Tom & Lucie, Guichen', 47.96650, -1.79638, '5,20 €', 1, '{}', 40, 'demo.enzo@example.com', 123, '{}', false, false),
    ('Viennoiseries à -50 % en fin de journée', 'supermarket', 'bruz', 'Boulangerie JOI, Pont-Péan', 48.00927, -1.69996, '-50 %', 1, '{}', null, 'demo.jade@example.com', 62, '{}', false, false),
    ('Plats préparés à -40 % après 19 h', 'supermarket', 'bruz', 'L''Échoppe, Pont-Réan', 48.00210, -1.75992, '-40 %', 1, '{}', null, 'demo.lucas@example.com', 147, '{}', false, false),
    ('Pain de la veille à moitié prix', 'supermarket', null, 'Boulangerie Gauthier, Bourg-des-Comptes', 47.92845, -1.73772, '-50 %', 1, '{}', null, 'demo.manon@example.com', 6, '{}', false, false),
    ('Formule midi sandwich + boisson', 'supermarket', 'bruz', 'Boulangerie Pâtisserie Corlay, Bruz', 48.02463, -1.75196, '5,20 €', 1, '{}', 21, 'demo.theo@example.com', 28, '{}', false, false),
    ('Petit-déjeuner étudiant à 3 €', 'supermarket', 'bruz', 'Amicalement bio, Laillé', 47.97878, -1.73171, '3 €', 1, '{}', 40, 'demo.zoe@example.com', 96, '{student_card}', false, false),
    ('Viennoiseries à -50 % en fin de journée', 'supermarket', 'bruz', 'La Fournée Bruzoise, Bruz', 48.02399, -1.74691, '-50 %', 1, '{}', 40, 'demo.gabin@example.com', 58, '{}', false, false),
    ('Pain de la veille à moitié prix', 'supermarket', 'rennes', 'Le P''ti Fournil Gourmand, Rennes', 48.08643, -1.67576, '-50 %', 1, '{}', 12, 'demo.louise@example.com', 83, '{}', false, false),
    ('Cagette de fruits et légumes à 4 €', 'supermarket', null, 'Mon Bon Marché, Bréal-sous-Montfort', 48.05501, -1.86984, '4 €', 1, '{}', null, 'demo.noah@example.com', 155, '{}', false, false),
    ('Formule midi sandwich + boisson', 'supermarket', null, 'Pains et Divines Saveurs, Pléchâtel', 47.89513, -1.74877, '5,20 €', 1, '{}', null, 'demo.lea@example.com', 20, '{}', false, false),
    ('Viennoiseries à -50 % en fin de journée', 'supermarket', 'rennes', 'Simon & Simon, Chantepie', 48.08751, -1.62006, '-50 %', 1, '{}', 40, 'demo.hugo@example.com', 141, '{}', false, false),
    ('Plats préparés à -40 % après 19 h', 'supermarket', 'rennes', 'day by day, Rennes', 48.10704, -1.67126, '-40 %', 1, '{}', null, 'demo.ines@example.com', 92, '{}', false, false),
    ('Petit-déjeuner étudiant à 3 €', 'supermarket', 'rennes', 'primeur et saveurs, Pacé', 48.14791, -1.77354, '3 €', 1, '{}', null, 'demo.malo@example.com', 160, '{student_card}', false, false),
    ('Pain de la veille à moitié prix', 'supermarket', 'ker-lann', 'Valérie et Frédéric Aubert, Chartres-de-Bretagne', 48.04154, -1.70614, '-50 %', 1, '{}', 21, 'demo.sarah@example.com', 60, '{}', false, false),
    ('Places de dernière minute à 8 €', 'activity', 'bruz', 'Amphithéâtre Simone Veil, Bruz', 48.02264, -1.75129, '8 €', 1, '{culture}', 21, 'demo.yanis@example.com', 87, '{under_26}', false, false),
    ('Spectacle à tarif étudiant', 'activity', 'ker-lann', 'MusikHall, Chartres-de-Bretagne', 48.05726, -1.73294, '10 €', 1, '{culture}', 40, 'demo.chloe@example.com', 9, '{student_card}', false, false),
    ('Séance à 5,50 € en semaine', 'activity', null, 'La Bobine, Bréal-sous-Montfort', 48.04987, -1.86671, '5,50 €', 1, '{cinema}', null, 'demo.tom@example.com', 51, '{student_card}', false, false),
    ('Places de dernière minute à 8 €', 'activity', 'bruz', 'Le Grand Logis, Bruz', 48.02282, -1.74485, '8 €', 1, '{culture}', 12, 'demo.nolan@example.com', 69, '{under_26}', false, false),
    ('Séance à 5,50 € en semaine', 'activity', 'rennes', 'Pathé Rennes, Rennes', 48.10619, -1.67570, '5,50 €', 1, '{cinema}', 40, 'demo.camille@example.com', 119, '{student_card}', false, false),
    ('Séance à 5,50 € en semaine', 'activity', 'bruz', 'Cinéville Bruz, Bruz', 48.02913, -1.75317, '5,50 €', 1, '{cinema}', 12, 'demo.maelle@example.com', 139, '{student_card}', false, false),
    ('Spectacle à tarif étudiant', 'activity', 'rennes', 'Big Bang Circus, Saint-Jacques-de-la-Lande', 48.09760, -1.70379, '10 €', 1, '{culture}', 12, 'demo.enzo@example.com', 49, '{student_card}', false, false),
    ('Initiation escalade à tarif réduit', 'activity', 'bruz', 'Site d''escalade du Boël : secteur Moulin, Pont-Réan', 47.99262, -1.75334, '8 €', 1, '{outdoor}', 12, 'demo.jade@example.com', 6, '{student_card}', false, false),
    ('Entrée piscine à tarif étudiant', 'activity', null, 'Bassin sportif, Guichen', 47.96282, -1.80372, '2,80 €', 1, '{swimming}', 5, 'demo.lucas@example.com', 41, '{student_card}', false, false),
    ('Entrée piscine à tarif étudiant', 'activity', 'ker-lann', 'Piscine nordique, Chartres-de-Bretagne', 48.04022, -1.69252, '2,80 €', 1, '{swimming}', 12, 'demo.manon@example.com', 50, '{student_card}', false, false),
    ('-20 % en semaine à partir de 4', 'activity', 'rennes', 'Prison Island, Chantepie', 48.06618, -1.62530, '-20 %', 3, '{games}', 21, 'demo.theo@example.com', 130, '{student_card}', false, false),
    ('Places de dernière minute à 8 €', 'activity', null, 'L''Antichambre, Mordelles', 48.07602, -1.83969, '8 €', 1, '{culture}', null, 'demo.zoe@example.com', 121, '{under_26}', false, false),
    ('Spectacle à tarif étudiant', 'activity', 'rennes', 'Les Bizh Théâtre d''Impro, Rennes', 48.11143, -1.69247, '10 €', 1, '{culture}', null, 'demo.gabin@example.com', 32, '{student_card}', false, false),
    ('Entrée piscine à tarif étudiant', 'activity', 'rennes', 'Blue nat, Saint-Jacques-de-la-Lande', 48.09046, -1.69153, '2,80 €', 1, '{swimming}', null, 'demo.louise@example.com', 4, '{student_card}', false, false),
    ('Créneau libre étudiant', 'sport', 'rennes', 'Complexe sportif Chassebœuf, Pacé', 48.15292, -1.76875, '3 €', 1, '{team_sport}', 5, 'demo.noah@example.com', 57, '{student_card}', false, false),
    ('Inscription à moitié prix pour les boursiers', 'sport', 'ker-lann', 'Poney-club La Pérelle, Chavagne', 48.06649, -1.75102, '-50 %', 2, '{team_sport}', null, 'demo.lea@example.com', 145, '{scholarship}', false, false),
    ('Séance d''essai offerte', 'sport', null, 'Complexe sportif Beauséjour, Mordelles', 48.07173, -1.84140, 'Gratuit', 0, '{team_sport}', 40, 'demo.hugo@example.com', 41, '{}', false, false),
    ('Créneau libre étudiant', 'sport', 'ker-lann', 'Kart Expo, Chartres-de-Bretagne', 48.05478, -1.73070, '3 €', 1, '{team_sport}', 40, 'demo.ines@example.com', 141, '{student_card}', false, false),
    ('Inscription à moitié prix pour les boursiers', 'sport', 'bruz', 'Complexe Henri Brouillard, Pont-Réan', 48.00075, -1.78053, '-50 %', 2, '{team_sport}', 12, 'demo.malo@example.com', 113, '{scholarship}', false, false),
    ('Séance d''essai offerte', 'sport', 'rennes', 'Complexe sportif Charles Géniaux, Rennes', 48.11134, -1.71178, 'Gratuit', 0, '{team_sport}', 12, 'demo.sarah@example.com', 9, '{}', false, false),
    ('Créneau libre étudiant', 'sport', null, 'complexe sportif Coubertin, Mordelles', 48.07516, -1.84936, '3 €', 1, '{team_sport}', 5, 'demo.yanis@example.com', 56, '{student_card}', false, false),
    ('Premier mois offert', 'sport', 'bruz', 'CrossFit Madyo, Bruz', 48.02485, -1.76590, '1er mois offert', 2, '{fitness}', 40, 'demo.chloe@example.com', 67, '{student_card}', false, false),
    ('Inscription à moitié prix pour les boursiers', 'sport', 'bruz', 'L''Archipel, Laillé', 47.98264, -1.71810, '-50 %', 2, '{team_sport}', null, 'demo.tom@example.com', 126, '{scholarship}', false, false),
    ('Séance d''essai offerte', 'sport', 'bruz', 'Stades de la Croix, Saint-Erblon', 48.01816, -1.66347, 'Gratuit', 0, '{team_sport}', null, 'demo.nolan@example.com', 107, '{}', false, false),
    ('Créneau libre étudiant', 'sport', 'ker-lann', 'Complexe Sportif Raymond Perrin, Noyal-Châtillon-sur-Seiche', 48.03982, -1.66262, '3 €', 1, '{team_sport}', null, 'demo.camille@example.com', 125, '{student_card}', false, false),
    ('Inscription à moitié prix pour les boursiers', 'sport', 'bruz', 'Salle Alain Colas, Guichen', 47.96451, -1.79414, '-50 %', 2, '{team_sport}', 5, 'demo.maelle@example.com', 2, '{scholarship}', false, false),
    ('Formule étudiante à 8,90 €', 'restaurant', 'bruz', 'Café des Étangs (démo)', 48.02400, -1.74640, '8,90 €', 1, '{}', null, 'demo.commerce1@example.com', 58, '{student_card}', true, true),
    ('Boisson offerte sur présentation de l''appli', 'restaurant', 'bruz', 'Café des Étangs (démo)', 48.02400, -1.74640, 'dès 9 €', 1, '{}', 40, 'demo.commerce1@example.com', 145, '{}', true, false),
    ('-20 % le lundi soir', 'restaurant', 'bruz', 'Café des Étangs (démo)', 48.02400, -1.74640, '-20 %', 2, '{}', null, 'demo.commerce1@example.com', 118, '{}', true, false),
    ('Formule étudiante à 8,90 €', 'restaurant', 'ker-lann', 'Crêperie du Clocher (démo)', 48.04471, -1.70931, '8,90 €', 1, '{}', null, 'demo.commerce2@example.com', 84, '{student_card}', true, false),
    ('Boisson offerte sur présentation de l''appli', 'restaurant', 'ker-lann', 'Crêperie du Clocher (démo)', 48.04471, -1.70931, 'dès 9 €', 1, '{}', null, 'demo.commerce2@example.com', 40, '{}', true, false),
    ('-20 % le lundi soir', 'restaurant', 'ker-lann', 'Crêperie du Clocher (démo)', 48.04471, -1.70931, '-20 %', 2, '{}', null, 'demo.commerce2@example.com', 2, '{}', true, false),
    ('Formule étudiante à 8,90 €', 'restaurant', 'rennes', 'Cantine Verte (démo)', 48.08326, -1.70942, '8,90 €', 1, '{}', null, 'demo.commerce3@example.com', 55, '{student_card}', true, false),
    ('Boisson offerte sur présentation de l''appli', 'restaurant', 'rennes', 'Cantine Verte (démo)', 48.08326, -1.70942, 'dès 9 €', 1, '{}', 40, 'demo.commerce3@example.com', 39, '{}', true, false),
    ('-20 % le lundi soir', 'restaurant', 'rennes', 'Cantine Verte (démo)', 48.08326, -1.70942, '-20 %', 2, '{}', null, 'demo.commerce3@example.com', 97, '{}', true, false),
    ('Formule étudiante à 8,90 €', 'restaurant', 'bruz', 'Pizzeria des Deux Rives (démo)', 47.96450, -1.79607, '8,90 €', 1, '{}', 40, 'demo.commerce4@example.com', 72, '{student_card}', true, false),
    ('Boisson offerte sur présentation de l''appli', 'restaurant', 'bruz', 'Pizzeria des Deux Rives (démo)', 47.96450, -1.79607, 'dès 9 €', 1, '{}', null, 'demo.commerce4@example.com', 31, '{}', true, false),
    ('-20 % le lundi soir', 'restaurant', 'bruz', 'Pizzeria des Deux Rives (démo)', 47.96450, -1.79607, '-20 %', 2, '{}', null, 'demo.commerce4@example.com', 6, '{}', true, false),
    ('Panier étudiant à 5 €', 'supermarket', 'bruz', 'Épicerie du Bocage (démo)', 47.97812, -1.71750, '5 €', 1, '{}', 40, 'demo.commerce5@example.com', 52, '{student_card}', true, false),
    ('-15 % sur le vrac', 'supermarket', 'bruz', 'Épicerie du Bocage (démo)', 47.97812, -1.71750, '-15 %', 1, '{}', null, 'demo.commerce5@example.com', 117, '{}', true, false),
    ('Invendus du jour à -50 %', 'supermarket', 'bruz', 'Épicerie du Bocage (démo)', 47.97812, -1.71750, '-50 %', 1, '{}', 21, 'demo.commerce5@example.com', 81, '{}', true, false),
    ('Panier étudiant à 5 €', 'supermarket', 'ker-lann', 'Panier Malin (démo)', 48.05381, -1.79153, '5 €', 1, '{}', null, 'demo.commerce6@example.com', 137, '{student_card}', true, false),
    ('-15 % sur le vrac', 'supermarket', 'ker-lann', 'Panier Malin (démo)', 48.05381, -1.79153, '-15 %', 1, '{}', 40, 'demo.commerce6@example.com', 152, '{}', true, false),
    ('Invendus du jour à -50 %', 'supermarket', 'ker-lann', 'Panier Malin (démo)', 48.05381, -1.79153, '-50 %', 1, '{}', 21, 'demo.commerce6@example.com', 2, '{}', true, false),
    ('Panier étudiant à 5 €', 'supermarket', null, 'Marché des Halles Vertes (démo)', 48.09914, -1.79365, '5 €', 1, '{}', null, 'demo.commerce7@example.com', 103, '{student_card}', true, false),
    ('-15 % sur le vrac', 'supermarket', null, 'Marché des Halles Vertes (démo)', 48.09914, -1.79365, '-15 %', 1, '{}', 40, 'demo.commerce7@example.com', 94, '{}', true, false),
    ('Invendus du jour à -50 %', 'supermarket', null, 'Marché des Halles Vertes (démo)', 48.09914, -1.79365, '-50 %', 1, '{}', 21, 'demo.commerce7@example.com', 108, '{}', true, false),
    ('Séance d''essai gratuite', 'sport', 'rennes', 'Atelier Grimpe (démo)', 48.04877, -1.60554, 'Gratuit', 0, '{fitness}', 21, 'demo.commerce8@example.com', 28, '{}', true, true),
    ('Carnet 10 séances étudiant', 'sport', 'rennes', 'Atelier Grimpe (démo)', 48.04877, -1.60554, '45 €', 3, '{fitness,outdoor}', 40, 'demo.commerce8@example.com', 124, '{student_card}', true, false),
    ('Tarif boursier à 12 €/mois', 'sport', 'rennes', 'Atelier Grimpe (démo)', 48.04877, -1.60554, '12 €/mois', 2, '{fitness}', null, 'demo.commerce8@example.com', 20, '{scholarship}', true, false),
    ('Séance d''essai gratuite', 'sport', null, 'Studio Forme (démo)', 48.07118, -1.85103, 'Gratuit', 0, '{fitness}', 40, 'demo.commerce9@example.com', 106, '{}', true, false),
    ('Carnet 10 séances étudiant', 'sport', null, 'Studio Forme (démo)', 48.07118, -1.85103, '45 €', 3, '{fitness,outdoor}', 5, 'demo.commerce9@example.com', 31, '{student_card}', true, false),
    ('Tarif boursier à 12 €/mois', 'sport', null, 'Studio Forme (démo)', 48.07118, -1.85103, '12 €/mois', 2, '{fitness}', null, 'demo.commerce9@example.com', 141, '{scholarship}', true, false),
    ('Entrée à 5 € le mercredi', 'activity', 'bruz', 'Ciné Lanterne (démo)', 48.01629, -1.70814, '5 €', 1, '{culture}', 21, 'demo.commerce10@example.com', 149, '{student_card}', true, false),
    ('Soirée découverte gratuite', 'activity', 'bruz', 'Ciné Lanterne (démo)', 48.01629, -1.70814, 'Gratuit', 0, '{games,culture}', 40, 'demo.commerce10@example.com', 83, '{}', true, false),
    ('Pass 3 entrées à 12 €', 'activity', 'bruz', 'Ciné Lanterne (démo)', 48.01629, -1.70814, '12 €', 2, '{culture}', 5, 'demo.commerce10@example.com', 20, '{under_26}', true, false),
    ('Entrée à 5 € le mercredi', 'activity', 'rennes', 'La Fabrique à Jeux (démo)', 48.08850, -1.67900, '5 €', 1, '{culture}', 5, 'demo.commerce11@example.com', 88, '{student_card}', true, false),
    ('Soirée découverte gratuite', 'activity', 'rennes', 'La Fabrique à Jeux (démo)', 48.08850, -1.67900, 'Gratuit', 0, '{games,culture}', null, 'demo.commerce11@example.com', 88, '{}', true, false),
    ('Pass 3 entrées à 12 €', 'activity', 'rennes', 'La Fabrique à Jeux (démo)', 48.08850, -1.67900, '12 €', 2, '{culture}', null, 'demo.commerce11@example.com', 37, '{under_26}', true, false),
    ('Entrée à 5 € le mercredi', 'activity', 'ker-lann', 'Escale Culture (démo)', 48.04074, -1.66105, '5 €', 1, '{culture}', null, 'demo.commerce12@example.com', 139, '{student_card}', true, false),
    ('Soirée découverte gratuite', 'activity', 'ker-lann', 'Escale Culture (démo)', 48.04074, -1.66105, 'Gratuit', 0, '{games,culture}', 21, 'demo.commerce12@example.com', 46, '{}', true, false),
    ('Pass 3 entrées à 12 €', 'activity', 'ker-lann', 'Escale Culture (démo)', 48.04074, -1.66105, '12 €', 2, '{culture}', null, 'demo.commerce12@example.com', 6, '{under_26}', true, false),
    ('Chocolat chaud à 1,50 €', 'restaurant', 'bruz', 'Kiosque voisin (démo), Bruz', 48.02430, -1.74640, '1,50 €', 1, '{}', null, 'demo.enzo@example.com', 118, '{}', false, false)
  ) as v(title, category, zone_id, place_name, lat, lng, price_info, price_level, tags, expires_in, author, age_hours,
         requirements, official, boosted)
  join auth.users a on a.email = v.author
  join public.profiles p on p.id = a.id;

  -- ---------- Réactions (inventées, pour que les statistiques ne soient pas vides) ----------
  -- Tirage reproductible à partir du titre et de l'adresse ; jamais l'auteur.
  create temporary table demo_reactions on commit drop as
  select d.id as deal_id, a.id as user_id, abs(hashtext(d.title || a.email)::bigint) % 100 as r
  from public.deals d
  -- Seuls les étudiants de démo réagissent.
  join auth.users a on a.email like 'demo.%@example.com' and a.email not like 'demo.commerce%' and a.id <> d.author_id
  join auth.users author on author.id = d.author_id and author.email like 'demo.%@example.com';

  insert into public.deal_views (deal_id, user_id) select deal_id, user_id from demo_reactions where r < 80;
  insert into public.deal_visits (deal_id, user_id) select deal_id, user_id from demo_reactions where r < 30;
  insert into public.favorites (deal_id, user_id) select deal_id, user_id from demo_reactions where r % 7 = 0;
  -- Votes positifs uniquement : aucun bon plan n'est masqué au départ.
  insert into public.votes (deal_id, user_id, value) select deal_id, user_id, 1 from demo_reactions where r < 45;

  -- Des niveaux d'activité variés : trois comptes sans accès complet depuis plus de 7 jours.
  update public.profiles set last_contribution_at = now() - interval '10 days'
   where id in (select id from auth.users where email in ('demo.sarah@example.com', 'demo.tom@example.com', 'demo.gabin@example.com'));
end
$reset$;

-- Contrôle après exécution : un compte de la liste par ligne, puis les totaux.
select r.compte_a_garder, r.etat,
  (select count(*) from auth.users) as comptes,
  (select count(*) from public.deals) as bons_plans,
  (select count(*) from public.deals where link_url is not null) as sources,
  (select count(*) from public.deals where description like 'Exemple fictif (démo)%') as exemples,
  (select count(*) from public.votes) as votes,
  (select count(*) from public.businesses) as commerces,
  (select count(*) from public.deals where is_official) as offres_commercants
from reset_report r order by r.compte_a_garder;
