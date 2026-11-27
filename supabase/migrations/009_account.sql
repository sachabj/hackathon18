-- ShareWood — compte et confidentialité (relançable sans risque).
-- Prérequis : migrations 005 et 007 appliquées (leurs règles sont ajustées ici). Responsable : Sacha.

-- ---------- Anonymat : chacun ne lit que son propre profil ----------
-- Les bons plans et les votes ne portent qu'un identifiant technique, qu'on ne peut plus relier à un pseudo.
drop policy if exists "profils lisibles" on public.profiles;
drop policy if exists "lire son profil" on public.profiles;
create policy "lire son profil" on public.profiles for select to authenticated using (id = auth.uid());

-- ---------- Inscription : acceptation de la politique de confidentialité ----------
-- Date posée par la base à l'inscription, non modifiable depuis l'app (aucun GRANT sur la colonne).
alter table public.profiles add column if not exists privacy_accepted_at timestamptz;

update public.profiles set username = left(username, 40) where char_length(username) > 40;
alter table public.profiles drop constraint if exists username_length;
alter table public.profiles add constraint username_length check (char_length(username) <= 40);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, last_contribution_at, privacy_accepted_at)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 40),
    now(),
    case when new.raw_user_meta_data->>'privacy_accepted' = 'true' then now() end
  );
  return new;
end $$;

-- ---------- Suppression de compte : les bons plans encore utiles restent, sans auteur ----------
alter table public.deals alter column author_id drop not null;
alter table public.deals drop constraint if exists deals_author_id_fkey;
alter table public.deals add constraint deals_author_id_fkey
  foreign key (author_id) references public.profiles on delete set null;

-- « author_id <> moi » est faux quand il n'y a plus d'auteur : on compare avec « is distinct from ».
drop policy if exists "enregistrer sa vue" on public.deal_views;
create policy "enregistrer sa vue" on public.deal_views for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.deals d where d.id = deal_id and d.author_id is distinct from auth.uid())
);
drop policy if exists "déclarer son passage" on public.deal_visits;
create policy "déclarer son passage" on public.deal_visits for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.deals d where d.id = deal_id and d.author_id is distinct from auth.uid())
);

create or replace function public.deals_near_my_business() returns setof public.deals
language sql stable security definer set search_path = public as $$
  select d.*
  from public.deals d
  join public.businesses b on b.owner_id = auth.uid()
  where public.is_merchant()
    and d.scope = 'local' and not d.is_official and d.author_id is distinct from b.owner_id
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

-- Bons plans conservés : encore actifs, et confirmés par d'autres (plus de 👍 que de 👎, auteur exclu).
-- Les offres officielles partent avec le compte du commerçant, qui seul pourrait les retirer.
create or replace function public.my_kept_deals() returns table (deal_id uuid, photo_url text)
language sql stable security definer set search_path = public as $$
  select d.id, to_jsonb(d)->>'photo_url'
  from public.deals d
  where d.author_id = auth.uid()
    and not d.is_official
    and not d.ended_by_merchant
    and (d.expires_at is null or d.expires_at > now())
    and (select count(*) filter (where v.value = 1) > count(*) filter (where v.value = -1)
         from public.votes v where v.deal_id = d.id and v.user_id <> d.author_id);
$$;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Connexion requise.'; end if;
  delete from public.deals d
   where d.author_id = me and not exists (select 1 from public.my_kept_deals() k where k.deal_id = d.id);
  -- Cascade : profil, préférences, votes, favoris, vues, passages, commerce. Bons plans gardés : auteur effacé.
  delete from auth.users where id = me;
end $$;

revoke execute on function public.my_kept_deals(), public.delete_my_account() from public, anon;
grant execute on function public.my_kept_deals(), public.delete_my_account() to authenticated;

-- Pour pouvoir effacer ses photos, il faut d'abord pouvoir lister les siennes.
drop policy if exists "photos : voir les siennes" on storage.objects;
create policy "photos : voir les siennes" on storage.objects for select to authenticated
  using (bucket_id = 'deal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
