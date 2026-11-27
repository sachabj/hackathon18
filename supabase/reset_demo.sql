-- =====================================================================
-- ShareWood — remise à zéro de la base + données de démo. ⚠️ SUPPRESSION DÉFINITIVE.
-- Prérequis : migrations 004 à 007 appliquées. À coller dans Supabase → SQL Editor → Run.
--
-- 1. Remplir ci-dessous les comptes à GARDER et le mot de passe des comptes de démo
--    (ne jamais committer ces valeurs : le dépôt est public).
-- 2. Tout compte absent de la liste est effacé, avec ses bons plans, votes, favoris et commerce.
--    Une adresse de la liste sans compte est ignorée (la personne pourra s'inscrire plus tard) et affichée
--    à la fin. ⚠️ Vérifie l'orthographe : une faute de frappe efface le vrai compte. Pour comparer avant :
--    select email from auth.users order by email;
-- Le script est « tout ou rien » : à la moindre erreur, rien n'est modifié. Relançable.
--
-- Données : « Source : … » = offre trouvée sur le web le 27/11/2026 (prix à revérifier avant la démo).
--           « [Exemple] » = offre INVENTÉE sur un lieu réel, à ne pas présenter comme vraie.
-- Lieux : coordonnées OpenStreetMap. Aucune offre n'est « officielle » (aucun commerce n'a de compte).
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
  delete from public.deals where description like 'Exemple fictif (démo)%'; -- ancien seed_demo.sql

  -- ---------- Étudiants de démo ----------
  for u in
    select * from (values
      ('demo.lea@example.com',    'Léa (démo)',    'ker-lann', '{restaurant,supermarket,activity}',   '{walk,bike}', 'tight',    '{cinema,games}',        'sometimes', true,  '{train}'),
      ('demo.hugo@example.com',   'Hugo (démo)',   'ker-lann', '{transport,restaurant,sport}',        '{bus}',       'balanced', '{team_sport,nightlife}', 'often',    false, '{train,carpool}'),
      ('demo.ines@example.com',   'Inès (démo)',   'bruz',     '{activity,scholarship,restaurant}',   '{bike}',      'tight',    '{culture,music}',        'sometimes', true,  '{train,bus}'),
      ('demo.malo@example.com',   'Malo (démo)',   'bruz',     '{supermarket,restaurant,transport}',  '{car}',       'balanced', '{fitness,outdoor}',      'often',    false, '{carpool}'),
      ('demo.sarah@example.com',  'Sarah (démo)',  'rennes',   '{activity,carte_sortir,transport}',   '{bus,walk}',  'comfort',  '{cinema,culture}',       'never',    true,  '{plane,train}'),
      ('demo.yanis@example.com',  'Yanis (démo)',  'rennes',   '{scholarship,transport,supermarket}', '{bus}',       'tight',    '{games,swimming}',       'sometimes', false, '{bus}'),
      ('demo.chloe@example.com',  'Chloé (démo)',  'ker-lann', '{sport,activity,restaurant}',         '{bike,walk}', 'balanced', '{fitness,swimming}',     'sometimes', true,  '{train}'),
      ('demo.tom@example.com',    'Tom (démo)',    'bruz',     '{restaurant,activity,supermarket}',   '{train}',     'comfort',  '{music,nightlife}',      'often',    false, '{train}')
    ) as s(email, username, zone, categories, transports, budget, activities, home_visits, wants_travel, travel)
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
      home_visits, wants_travel, travel_modes)
    values (new_id, u.zone, u.transports::text[], u.budget, u.activities::text[],
      u.home_visits, u.wants_travel, u.travel::text[]);
  end loop;

  -- Aides (colonnes de la migration 010 ; ignoré tant qu'elle n'est pas lancée).
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'preferences' and column_name = 'is_scholarship') then
    update public.preferences x
       set is_scholarship = a.email in ('demo.ines@example.com', 'demo.yanis@example.com'),
           has_carte_sortir = a.email = 'demo.sarah@example.com'
      from auth.users a
     where a.id = x.user_id and a.email like 'demo.%@example.com';
  end if;

  -- ---------- Bons plans ----------
  insert into public.deals (title, description, category, subcategory, scope, zone_id, place_name, lat, lng,
    price_info, price_level, tags, expires_at, deadline_at, author_id, created_at)
  select v.title, v.description, v.category::deal_category, v.subcategory::deal_subcategory, v.scope::deal_scope,
    v.zone_id, v.place_name, v.lat::double precision, v.lng::double precision, v.price_info, v.price_level,
    v.tags::text[], v.expires_at::timestamptz, v.deadline_at::timestamptz, p.id,
    now() - make_interval(hours => v.age_hours)
  from (values
    -- ===== Offres sourcées =====
    ('Repas Crous à 1 € pour tous les étudiants',
     'Plat + 2 périphériques avec un compte Izly actif. Resto U'' ouvert du lundi au vendredi, 11h30-13h45. Source : https://www.lessentiel.fr/rennes/notre-ville/2026-05-04/rennes-le-repas-etudiant-1-eu-pour-tous-20667 et https://www.crous-rennes.fr/restaurant/resto-u-ker-lann-3/',
     'restaurant', null, 'local', 'ker-lann', 'Resto U'' Ker Lann, campus de Ker Lann', 48.04659, -1.74174, '1 €', 1, '{}', null, null, 'demo.lea@example.com', 70),
    ('Ciné à 7,80 € en tarif étudiant',
     'Sur justificatif, hors supplément 3D. Source : https://bruz.cineville.fr/tarifs/4037',
     'activity', null, 'local', 'bruz', 'Cinéville Bruz, 15 avenue de Cézembre', 48.02913, -1.75317, '7,80 €', 1, '{cinema}', null, null, 'demo.tom@example.com', 52),
    ('Moins de 26 ans : la séance de ciné à 6 €',
     'Carte CinéLiberté -26 ans : 6 € la séance, adhésion de 12 € par an. Source : https://bruz.cineville.fr/tarifs/4037',
     'activity', null, 'local', 'bruz', 'Cinéville Bruz, 15 avenue de Cézembre', 48.02920, -1.75290, '6 € la séance', 1, '{cinema}', null, null, 'demo.ines@example.com', 30),
    ('Spectacles à 9 € pour les étudiants',
     'Saison 2026-2027, toutes catégories, avec la carte étudiante de l''année. Source : https://legrandlogis-bruz.fr/tarifs-abonnements/tarifs/',
     'activity', null, 'local', 'bruz', 'Le Grand Logis, 10 avenue du Général de Gaulle', 48.02282, -1.74485, '9 €', 1, '{culture,music}', null, null, 'demo.ines@example.com', 96),
    ('Carte Sortir ! : spectacles à 4 €',
     'Tarif Sortir ! toutes catégories, saison 2026-2027. Source : https://legrandlogis-bruz.fr/tarifs-abonnements/tarifs/',
     'carte_sortir', null, 'local', 'bruz', 'Le Grand Logis, 10 avenue du Général de Gaulle', 48.02270, -1.74510, '4 €', 1, '{culture}', null, null, 'demo.sarah@example.com', 44),
    ('Cinéma Arvor : 7,20 € pour les étudiants',
     'Tarifs 2026, sur justificatif. Source : https://www.cinema-arvor.fr/tarifs/',
     'activity', null, 'local', 'rennes', 'Cinéma Arvor, 11 rue de Châtillon', 48.10234, -1.67445, '7,20 €', 1, '{cinema,culture}', null, null, 'demo.sarah@example.com', 60),
    ('Expos gratuites au musée des Beaux-Arts',
     'Expositions temporaires gratuites pour les moins de 26 ans et les étudiants ; collections gratuites pour tous. Du mardi au dimanche, 10h-18h. Source : https://mba.rennes.fr/infos-pratiques/horaires-acces-tarifs',
     'activity', null, 'local', 'rennes', 'Musée des Beaux-Arts, 20 quai Émile Zola', 48.10962, -1.67494, 'Gratuit', 0, '{culture}', null, null, 'demo.yanis@example.com', 28),
    ('STAR : forfait étudiant à 19,95 €/mois',
     'Bus, métro et vélos illimités, 239,40 € sur 12 mois. 18-26 ans habitant Rennes Métropole. Source : https://www.star.fr/star-et-moi/parent-eleve-etudiant/tarifs-etudiants',
     'transport', 'bus', 'zone', 'rennes', null, null, null, '19,95 €/mois', 2, '{}', null, null, 'demo.yanis@example.com', 120),
    ('Boursiers : transports STAR jusqu''à la gratuité',
     '-50 % à l''échelon 2, -85 % aux échelons 3 et 4, gratuit des échelons 5 à 7 (Rennes Métropole, demande en ligne). Source : https://www.star.fr/star-et-moi/parent-eleve-etudiant/tarifs-etudiants',
     'transport', 'bus', 'zone', 'rennes', null, null, null, 'dès 0 €', 0, '{}', null, null, 'demo.yanis@example.com', 80),
    ('Unipass : STAR + TER pour les moins de 27 ans',
     '12 € la semaine ou 27 € le mois. Source : https://www.star.fr/star-et-moi/parent-eleve-etudiant/tarifs-etudiants',
     'transport', 'train', 'zone', 'bruz', null, null, null, '27 €/mois', 3, '{}', null, null, 'demo.malo@example.com', 40),
    ('TER BreizhGo -26 ans : billets dès 4 €',
     'Prix fixes selon la distance pour les moins de 26 ans. Source : https://www.ter.sncf.com/bretagne/tarifs-cartes/billets-moins-26-ans/voyage-ter-breizhgo-moins-26',
     'transport', 'train', 'zone', 'rennes', null, null, null, 'dès 4 €', 1, '{}', null, null, 'demo.hugo@example.com', 55),
    ('Carte Avantage Jeune SNCF : -30 % sur le train',
     '49 € pour un an, de 12 à 27 ans, réduction surtout sur TGV INOUI et Intercités. Source : https://www.sncf-connect.com/bons-plans/cartes-avantage',
     'transport', 'train', 'national', null, null, null, null, '49 € / an', 3, '{}', null, null, 'demo.hugo@example.com', 100),
    ('Pass''Sport : 50 € pour les boursiers',
     'Moins de 28 ans avec une bourse attribuée avant le 15/10/2026 ; à utiliser avant le 31/12/2026. Source : https://www.service-public.gouv.fr/particuliers/actualites/A14916',
     'sport', null, 'national', null, null, null, null, '-50 €', 0, '{team_sport,fitness}', '2026-12-31 23:59:59+01', '2026-12-31 23:59:59+01', 'demo.chloe@example.com', 36),
    ('Bourse 2026-2027 : dépôt tardif possible jusqu''au 31/12',
     'Après le 31 mai le dossier (DSE) n''est plus prioritaire, mais reste accepté jusqu''au 31 décembre 2026. Source : https://www.etudiant.gouv.fr/fr/bourse-et-logement-etudiant-constituez-votre-dossier-social-etudiant-dse-409',
     'scholarship', null, 'national', null, null, null, null, 'Gratuit', 0, '{}', '2026-12-31 23:59:59+01', '2026-12-31 23:59:59+01', 'demo.ines@example.com', 26),
    -- ===== Exemples inventés sur des lieux réels =====
    ('[Exemple] Pâtes à -50 %', 'Exemple fictif (démo) : offre inventée.',
     'supermarket', null, 'local', 'bruz', 'Intermarché, 2 place du Vert Buisson', 48.02918, -1.76081, '0,89 €', 1, '{}', null, null, 'demo.malo@example.com', 6),
    ('[Exemple] Panier fruits et légumes à 4 €', 'Exemple fictif (démo) : offre inventée.',
     'supermarket', null, 'local', 'bruz', 'Super U, Bruz', 48.02196, -1.74369, '4 €', 1, '{}', null, null, 'demo.lea@example.com', 27),
    ('[Exemple] -10 % étudiants le mercredi', 'Exemple fictif (démo) : offre inventée.',
     'supermarket', null, 'local', 'bruz', 'Carrefour City, 9 place du Docteur Joly', 48.02402, -1.74671, '-10 %', 1, '{}', null, null, 'demo.malo@example.com', 50),
    ('[Exemple] Menu étudiant à 6,50 €', 'Exemple fictif (démo) : offre inventée.',
     'restaurant', null, 'local', 'ker-lann', 'McDonald''s, Ker Lann', 48.05573, -1.73974, '6,50 €', 1, '{}', null, null, 'demo.hugo@example.com', 4),
    ('[Exemple] Boisson offerte avec un sandwich', 'Exemple fictif (démo) : offre inventée.',
     'restaurant', null, 'local', 'ker-lann', 'Subway, Ker Lann', 48.04595, -1.74141, 'dès 5 €', 1, '{}', null, null, 'demo.chloe@example.com', 31),
    ('[Exemple] Invendus du soir à moitié prix', 'Exemple fictif (démo) : offre inventée.',
     'restaurant', null, 'local', 'bruz', 'La Fournée Bruzoise', 48.02399, -1.74691, '-50 %', 1, '{}', null, null, 'demo.tom@example.com', 2),
    ('[Exemple] 2 pizzas achetées, la 3e offerte', 'Exemple fictif (démo) : offre inventée.',
     'restaurant', null, 'local', 'bruz', 'Pizza Chouchou', 48.02405, -1.74620, 'dès 9 €', 1, '{}', null, null, 'demo.tom@example.com', 75),
    ('[Exemple] Premier mois de salle offert', 'Exemple fictif (démo) : offre inventée.',
     'sport', null, 'local', 'bruz', 'Giga Fit, Bruz', 48.02211, -1.74304, '1er mois offert', 2, '{fitness}', null, null, 'demo.chloe@example.com', 48),
    ('[Exemple] Covoiturage Bruz → Rennes le vendredi', 'Exemple fictif (démo) : trajet inventé.',
     'transport', 'carpool', 'zone', 'bruz', null, null, null, '2 €', 1, '{}', null, null, 'demo.malo@example.com', 8)
  ) as v(title, description, category, subcategory, scope, zone_id, place_name, lat, lng, price_info, price_level,
         tags, expires_at, deadline_at, author, age_hours)
  join auth.users a on a.email = v.author
  join public.profiles p on p.id = a.id;

  -- ---------- Réactions (inventées, pour que les statistiques ne soient pas vides) ----------
  -- Tirage reproductible à partir du titre et de l'adresse ; jamais l'auteur.
  create temporary table demo_reactions on commit drop as
  select d.id as deal_id, a.id as user_id, abs(hashtext(d.title || a.email)::bigint) % 100 as r
  from public.deals d
  join auth.users a on a.email like 'demo.%@example.com' and a.id <> d.author_id
  join auth.users author on author.id = d.author_id and author.email like 'demo.%@example.com';

  insert into public.deal_views (deal_id, user_id) select deal_id, user_id from demo_reactions where r < 80;
  insert into public.deal_visits (deal_id, user_id) select deal_id, user_id from demo_reactions where r < 30;
  insert into public.favorites (deal_id, user_id) select deal_id, user_id from demo_reactions where r % 7 = 0;
  -- Votes positifs uniquement : aucun bon plan n'est masqué au départ.
  insert into public.votes (deal_id, user_id, value) select deal_id, user_id, 1 from demo_reactions where r < 45;

  -- Des niveaux d'activité variés : deux comptes sans accès complet depuis plus de 7 jours.
  update public.profiles set last_contribution_at = now() - interval '10 days'
   where id in (select id from auth.users where email in ('demo.sarah@example.com', 'demo.tom@example.com'));
end
$reset$;

-- Contrôle après exécution : un compte de la liste par ligne, puis les totaux.
select r.compte_a_garder, r.etat,
  (select count(*) from auth.users) as comptes,
  (select count(*) from public.deals) as bons_plans,
  (select count(*) from public.deals where description like '%Source : %') as sources,
  (select count(*) from public.deals where title like '[Exemple]%') as exemples,
  (select count(*) from public.votes) as votes
from reset_report r order by r.compte_a_garder;
