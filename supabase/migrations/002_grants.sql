-- Waze-Etu — droits du rôle "authenticated" (les projets Supabase récents ne les donnent plus par défaut).
-- À exécuter dans le SQL Editor APRÈS schema.sql (déjà inclus en fin de schema.sql pour un projet neuf).
-- Les policies RLS restreignent ensuite ligne par ligne. Le rôle "anon" n'a volontairement aucun droit.
grant usage on schema public to authenticated;
grant select on public.zones to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.deals to authenticated;
grant select, insert, update on public.votes to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select on public.user_contributions to authenticated;
grant execute on function public.has_full_access(), public.is_merchant(), public.active_users_in_zone(text) to authenticated;
