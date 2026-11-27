-- Waze-Etu — verrouille les colonnes sensibles (à exécuter après 002_grants.sql).
-- La RLS filtre les lignes, pas les colonnes : sans ceci, un étudiant peut se déclarer commerçant,
-- rendre son offre "officielle", antidater un bon plan ou se redonner l'accès complet.
-- Non modifiables depuis l'app : profiles.role / last_contribution_at, deals.is_official (après publication),
-- deals.created_at, deals.author_id (après publication).
revoke update on public.profiles from authenticated;
grant update (username, followed_categories, followed_zone_ids, onboarded) on public.profiles to authenticated;

revoke insert, update on public.deals from authenticated;
grant insert (title, description, category, subcategory, scope, zone_id, place_name, lat, lng,
              price_info, expires_at, deadline_at, is_official, author_id) on public.deals to authenticated;
grant update (title, description, category, subcategory, scope, zone_id, place_name, lat, lng,
              price_info, expires_at, deadline_at, ended_by_merchant) on public.deals to authenticated;
