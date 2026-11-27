-- ShareWood — photo de preuve d'un bon plan (relançable sans risque). Responsable : Matteo.
-- La photo utilisée par l'assistant IA de /publier est déposée dans le stockage public `deal-photos`
-- (dossier = id de l'auteur) et son lien est enregistré dans deals.photo_url, affiché dans le fil.

alter table public.deals add column if not exists photo_url text;
-- Seuls des liens vers notre propre stockage sont acceptés (pas d'image externe arbitraire).
alter table public.deals drop constraint if exists photo_url_from_storage;
alter table public.deals add constraint photo_url_from_storage
  check (photo_url is null or photo_url like '%/storage/v1/object/public/deal-photos/%');
grant insert (photo_url), update (photo_url) on public.deals to authenticated;

-- Stockage public : l'image est lisible par son lien, sans connexion (photos d'affiches de magasin).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deal-photos', 'deal-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Chaque étudiant ne dépose et ne supprime que dans son dossier `<son id>/…`.
drop policy if exists "photos : déposer dans son dossier" on storage.objects;
create policy "photos : déposer dans son dossier" on storage.objects for insert to authenticated
  with check (bucket_id = 'deal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "photos : supprimer les siennes" on storage.objects;
create policy "photos : supprimer les siennes" on storage.objects for delete to authenticated
  using (bucket_id = 'deal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
