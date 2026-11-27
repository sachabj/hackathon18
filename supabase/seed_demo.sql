-- ShareWood — bons plans d'EXEMPLE (fictifs) pour la démo. À exécuter dans le SQL Editor APRÈS la migration 004,
-- une fois qu'au moins un compte existe (il en devient l'auteur). Relançable : les titres déjà présents sont ignorés.
-- Pour tout retirer : delete from public.deals where description like 'Exemple fictif (démo)%';

insert into public.deals
  (title, description, category, subcategory, scope, zone_id, place_name, lat, lng, price_info, price_level, tags, expires_at, deadline_at, author_id, created_at)
select
  v.title, 'Exemple fictif (démo). ' || v.description, v.category::deal_category, v.subcategory::deal_subcategory,
  v.scope::deal_scope, v.zone_id, v.place_name, v.lat::double precision, v.lng::double precision,
  v.price_info, v.price_level, v.tags::text[],
  case when v.expires_in is null then null else now() + (v.expires_in || ' days')::interval end,
  case when v.deadline_in is null then null else now() + (v.deadline_in || ' days')::interval end,
  a.id, now() - (v.age_hours || ' hours')::interval
from (values
  ('Menu étudiant à 6,50 €', 'Sur présentation de la carte étudiante, le midi.', 'restaurant', null, 'local', 'ker-lann', 'Snack du campus (exemple)', 48.0509, -1.7412, '6,50 €', 1, '{}', 15, null, 30),
  ('2 pizzas achetées, la 3e offerte', 'Le mardi soir, à emporter.', 'restaurant', null, 'local', 'bruz', 'Pizzeria du centre (exemple)', 48.0238, -1.7468, 'dès 9 €', 1, '{}', 10, null, 50),
  ('Brunch à volonté étudiant', 'Le dimanche, sur réservation.', 'restaurant', null, 'local', 'rennes', 'Café des Lices (exemple)', 48.1125, -1.6838, '19 €', 2, '{}', 20, null, 28),
  ('Pâtes à -50 %', 'Paquets de 1 kg, dans la limite des stocks.', 'supermarket', null, 'local', 'bruz', 'Supérette de Bruz (exemple)', 48.0262, -1.7441, '0,89 € le kg', 1, '{}', 4, null, 5),
  ('Panier anti-gaspi à 4 €', 'Fruits et légumes, à partir de 18 h.', 'supermarket', null, 'local', 'ker-lann', 'Épicerie du campus (exemple)', 48.0494, -1.7433, '4 €', 1, '{}', null, null, 26),
  ('Séance de ciné à 5 €', 'Tarif étudiant en semaine.', 'activity', null, 'local', 'bruz', 'Cinéma de quartier (exemple)', 48.0251, -1.7502, '5 €', 1, '{cinema}', 30, null, 40),
  ('Piscine : entrée à 2,50 €', 'Créneau étudiant le jeudi soir.', 'activity', null, 'local', 'bruz', 'Piscine municipale (exemple)', 48.0207, -1.7428, '2,50 €', 1, '{swimming}', null, null, 72),
  ('Soirée jeux de société gratuite', 'Chaque mercredi, boissons à petit prix.', 'activity', null, 'local', 'ker-lann', 'Foyer du campus (exemple)', 48.0512, -1.7405, 'Gratuit', 0, '{games,nightlife}', 12, null, 2),
  ('Concert étudiant à Rennes', 'Entrée à tarif réduit avec la carte étudiante.', 'activity', null, 'local', 'rennes', 'Salle de concert (exemple)', 48.1060, -1.6760, '12 €', 2, '{music,nightlife}', 8, null, 20),
  ('Salle de sport : 1er mois offert', 'Sans frais d''inscription pour les étudiants.', 'sport', null, 'local', 'bruz', 'Salle de fitness (exemple)', 48.0289, -1.7479, 'puis 19 €/mois', 2, '{fitness}', 25, null, 36),
  ('Licence multisport à prix réduit', 'Foot, basket, volley : inscriptions ouvertes.', 'sport', null, 'zone', 'ker-lann', null, null, null, '25 € l''année', 2, '{team_sport}', null, 14, 60),
  ('Billets de train jeunes à -30 %', 'Sur les trajets du week-end.', 'transport', 'train', 'national', null, null, null, null, '-30 %', 2, '{}', 21, null, 48),
  ('Covoiturage Bruz → Rennes', 'Départ 18 h le vendredi, 3 places.', 'transport', 'carpool', 'zone', 'bruz', null, null, null, '2 €', 1, '{}', 6, null, 3),
  ('Abonnement bus jeunes', 'Tarif réduit pour les moins de 27 ans.', 'transport', 'bus', 'zone', 'rennes', null, null, null, 'tarif réduit', 2, '{}', null, null, 90),
  ('Dossier de bourse : ne rate pas la date', 'Pense à préparer tes justificatifs.', 'scholarship', null, 'national', null, null, null, null, 'Gratuit', 0, '{}', null, 30, 96),
  ('Carte Sortir : renouvellement', 'Réductions sur la culture et le sport.', 'carte_sortir', null, 'zone', 'rennes', null, null, null, 'Gratuit', 0, '{culture,swimming}', null, 20, 80)
) as v(title, description, category, subcategory, scope, zone_id, place_name, lat, lng, price_info, price_level, tags, expires_in, deadline_in, age_hours)
cross join (select id from public.profiles order by created_at limit 1) a
where not exists (select 1 from public.deals d where d.title = v.title);
