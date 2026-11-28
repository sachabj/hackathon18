-- ShareWood — n'importe quelle ville de France (tâche 52). À exécuter après 026 ; relançable sans risque.
-- Les villes choisies par les étudiants deviennent des zones : la table `zones` reste la référence
-- des préférences (`home_zone_id`, `followed_zone_ids`) et des offres valables dans une ville (`deals.zone_id`).

alter table public.zones add column if not exists created_by uuid references public.profiles on delete set null;
alter table public.zones add column if not exists created_at timestamptz not null default now();

-- Ville trouvée par la recherche (Photon) ou « Me localiser » : renvoie la zone existante si elle est déjà
-- connue (même nom à moins de 10 km), sinon la crée. Identifiant lisible : « lyon-69 », « saint-denis-93 ».
create or replace function public.ensure_zone(
  p_name text, p_department text, p_lat float8, p_lng float8, p_radius_m int default 5000
) returns public.zones
language plpgsql security definer set search_path = public as $$
declare
  z public.zones;
  base text;
  candidate text;
  n int := 1;
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;
  p_name := trim(p_name);
  if char_length(coalesce(p_name, '')) not between 1 and 60 then raise exception 'Nom de ville invalide.'; end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'Coordonnées invalides.';
  end if;

  select * into z from public.zones
   where lower(name) = lower(p_name)
     and public.arrow_distance_m(center_lat, center_lng, p_lat, p_lng) < 10000
   order by public.arrow_distance_m(center_lat, center_lng, p_lat, p_lng) limit 1;
  if found then return z; end if;

  -- Garde-fou contre le remplissage de la table : 20 nouvelles villes par compte et par jour.
  if (select count(*) from public.zones where created_by = auth.uid() and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Trop de nouvelles villes aujourd''hui : réessaie demain.';
  end if;

  -- Accents retirés (décomposition NFD puis suppression des signes diacritiques), puis tirets.
  base := trim(both '-' from regexp_replace(regexp_replace(lower(normalize(p_name, nfd)), '[\u0300-\u036f]', '', 'g'), '[^a-z0-9]+', '-', 'g'));
  if base = '' then base := 'ville'; end if;
  base := left(base, 40) || coalesce('-' || nullif(lower(regexp_replace(coalesce(p_department, ''), '[^0-9abAB]', '', 'g')), ''), '');
  candidate := base;
  while exists (select 1 from public.zones where id = candidate) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;

  insert into public.zones (id, name, center_lat, center_lng, radius_m, created_by)
  values (candidate, p_name, p_lat, p_lng, least(greatest(coalesce(p_radius_m, 5000), 1500), 15000), auth.uid())
  returning * into z;
  return z;
end $$;

revoke execute on function public.ensure_zone(text, text, float8, float8, int) from public, anon;
grant execute on function public.ensure_zone(text, text, float8, float8, int) to authenticated;
