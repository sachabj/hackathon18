-- ShareWood — espace commerçant (à exécuter après 004_preferences.sql ; relançable sans risque).
-- N'importe quel compte peut se déclarer commerçant (choix de l'équipe). Garde-fous :
--   · un seul commerce par compte, adresse non modifiable depuis l'app ;
--   · retrait d'un bon plan d'étudiant limité à la même catégorie et à moins de 75 m du commerce ;
--   · chaque retrait garde la trace de son auteur (deals.ended_by), annulable seulement par lui.

create table if not exists public.businesses (
  owner_id uuid primary key references public.profiles on delete cascade,
  name text not null check (length(trim(name)) between 2 and 80),
  address text,
  category deal_category not null check (category in ('restaurant', 'supermarket', 'activity', 'sport')),
  zone_id text references public.zones,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  created_at timestamptz not null default now()
);

alter table public.businesses enable row level security;
drop policy if exists "commerces lisibles" on public.businesses;
create policy "commerces lisibles" on public.businesses for select to authenticated using (true);
grant select on public.businesses to authenticated; -- écriture : uniquement via register_business()

-- Colonnes non accordées en écriture : seules les fonctions ci-dessous les modifient.
alter table public.deals add column if not exists boosted_until timestamptz;
alter table public.deals add column if not exists ended_by uuid references public.profiles on delete set null;

create or replace function public.register_business(
  p_name text, p_address text, p_category deal_category, p_zone_id text,
  p_lat double precision, p_lng double precision
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;
  if exists (select 1 from public.businesses where owner_id = auth.uid()) then
    raise exception 'Ce compte a déjà un commerce.';
  end if;
  insert into public.businesses (owner_id, name, address, category, zone_id, lat, lng)
  values (auth.uid(), trim(p_name), nullif(trim(p_address), ''), p_category, p_zone_id, p_lat, p_lng);
  update public.profiles set role = 'merchant' where id = auth.uid();
end $$;

-- Mise en avant de 7 jours (paiement simulé dans l'app), cumulable.
create or replace function public.boost_offer(p_deal_id uuid) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare until timestamptz;
begin
  update public.deals
     set boosted_until = greatest(coalesce(boosted_until, now()), now()) + interval '7 days'
   where id = p_deal_id and author_id = auth.uid() and is_official and not ended_by_merchant
     and (expires_at is null or expires_at > now()) and public.is_merchant()
  returning boosted_until into until;
  if until is null then raise exception 'Cette offre ne peut pas être mise en avant.'; end if;
  return until;
end $$;

-- Statistiques de ses propres offres (les favoris sont privés : seul leur nombre est renvoyé).
create or replace function public.my_offer_stats()
returns table (deal_id uuid, confirmations integer, reports integer, favorites integer)
language sql stable security definer set search_path = public as $$
  select d.id,
    (select count(*)::int from public.votes v where v.deal_id = d.id and v.value = 1),
    (select count(*)::int from public.votes v where v.deal_id = d.id and v.value = -1),
    (select count(*)::int from public.favorites f where f.deal_id = d.id)
  from public.deals d
  where d.author_id = auth.uid();
$$;

-- Bons plans d'étudiants que le commerçant peut déclarer terminés : près de chez lui, même catégorie.
create or replace function public.deals_near_my_business() returns setof public.deals
language sql stable security definer set search_path = public as $$
  select d.*
  from public.deals d
  join public.businesses b on b.owner_id = auth.uid()
  where public.is_merchant()
    and d.scope = 'local' and not d.is_official and d.author_id <> b.owner_id
    and d.category = b.category
    and (d.expires_at is null or d.expires_at > now())
    and (not d.ended_by_merchant or d.ended_by = b.owner_id)
    -- distance haversine en mètres
    and 12742000 * asin(sqrt(
          power(sin(radians(d.lat - b.lat) / 2), 2) +
          cos(radians(b.lat)) * cos(radians(d.lat)) * power(sin(radians(d.lng - b.lng) / 2), 2)
        )) <= 75
  order by d.created_at desc;
$$;

create or replace function public.set_nearby_deal_ended(p_deal_id uuid, p_ended boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.deals_near_my_business() n where n.id = p_deal_id) then
    raise exception 'Ce bon plan ne concerne pas votre commerce.';
  end if;
  update public.deals
     set ended_by_merchant = p_ended, ended_by = case when p_ended then auth.uid() end
   where id = p_deal_id;
end $$;

-- L'auteur d'un bon plan ne peut pas annuler le retrait décidé par un commerçant.
create or replace function public.protect_merchant_end() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.ended_by is not null and not new.ended_by_merchant and auth.uid() is distinct from old.ended_by then
    raise exception 'Ce bon plan a été retiré par le commerçant.';
  end if;
  return new;
end $$;

drop trigger if exists deals_protect_merchant_end on public.deals;
create trigger deals_protect_merchant_end before update on public.deals
  for each row execute function public.protect_merchant_end();

revoke execute on function
  public.register_business(text, text, deal_category, text, double precision, double precision),
  public.boost_offer(uuid), public.my_offer_stats(), public.deals_near_my_business(),
  public.set_nearby_deal_ended(uuid, boolean)
from public, anon;
grant execute on function
  public.register_business(text, text, deal_category, text, double precision, double precision),
  public.boost_offer(uuid), public.my_offer_stats(), public.deals_near_my_business(),
  public.set_nearby_deal_ended(uuid, boolean)
to authenticated;
