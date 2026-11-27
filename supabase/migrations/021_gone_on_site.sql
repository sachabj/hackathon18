-- ShareWood — « Plus dispo » se signale sur place (à exécuter après 020_location_rules.sql ; relançable sans risque).
-- Sur une offre placée sur la carte, le signalement n'est accepté qu'avec une position à 500 m au plus :
-- impossible d'archiver une offre depuis chez soi. Inchangé : « J'y suis allé » (permis partout, sans Flèches
-- loin ou sans position), les offres sans lieu précis, et le retrait de son propre signalement.

create or replace function public.require_presence_to_report() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  lat float8 := nullif(current_setting('arrows.lat', true), '')::float8;
  lng float8 := nullif(current_setting('arrows.lng', true), '')::float8;
  d public.deals;
begin
  -- Seules les écritures de l'application sont contrôlées (pas les scripts de démo du SQL Editor).
  if coalesce(current_setting('role', true), '') <> 'authenticated' or new.value <> -1 then return new; end if;
  select * into d from public.deals where id = new.deal_id;
  if d.lat is null or d.lng is null then return new; end if;
  -- La position, transmise par react_to_deal, sert seulement à ce contrôle : elle n'est pas enregistrée.
  if lat is null or lng is null then
    raise exception '« Plus dispo » se signale sur place : partage ta position (Profil, « Ma localisation ») et autorise-la dans le navigateur.';
  end if;
  if public.arrow_distance_m(lat, lng, d.lat, d.lng) > 500 then
    raise exception 'Tu es à plus de 500 m de l''offre : « Plus dispo » se signale sur place.';
  end if;
  return new;
end $$;

drop trigger if exists votes_presence on public.votes;
create trigger votes_presence before insert or update on public.votes
  for each row execute function public.require_presence_to_report();

revoke execute on function public.require_presence_to_report() from public, anon, authenticated;
