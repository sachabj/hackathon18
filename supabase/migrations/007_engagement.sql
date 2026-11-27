-- ShareWood — audience des bons plans : vues et « J'y suis allé » (relançable sans risque).
-- Une ligne par étudiant et par bon plan ; l'auteur n'est jamais compté. Aucune de ces actions
-- ne compte comme une contribution (pas de remise à zéro des 7 jours d'accès).

create table if not exists public.deal_views (
  deal_id uuid not null references public.deals on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (deal_id, user_id)
);

create table if not exists public.deal_visits (
  deal_id uuid not null references public.deals on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (deal_id, user_id)
);

alter table public.deal_views enable row level security;
alter table public.deal_visits enable row level security;

-- Chacun ne lit que ses propres lignes : l'auteur n'obtient que des totaux (my_deal_audience).
drop policy if exists "lire ses vues" on public.deal_views;
create policy "lire ses vues" on public.deal_views for select to authenticated using (user_id = auth.uid());
drop policy if exists "enregistrer sa vue" on public.deal_views;
create policy "enregistrer sa vue" on public.deal_views for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.deals d where d.id = deal_id and d.author_id <> auth.uid())
);

drop policy if exists "lire ses passages" on public.deal_visits;
create policy "lire ses passages" on public.deal_visits for select to authenticated using (user_id = auth.uid());
drop policy if exists "déclarer son passage" on public.deal_visits;
create policy "déclarer son passage" on public.deal_visits for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.deals d where d.id = deal_id and d.author_id <> auth.uid())
);
drop policy if exists "retirer son passage" on public.deal_visits;
create policy "retirer son passage" on public.deal_visits for delete to authenticated using (user_id = auth.uid());

grant select on public.deal_views, public.deal_visits to authenticated;
grant insert (deal_id, user_id) on public.deal_views to authenticated;
grant insert (deal_id, user_id) on public.deal_visits to authenticated;
grant delete on public.deal_visits to authenticated;

-- Nombre d'étudiants passés sur un bon plan (affiché à tous).
create or replace function public.deal_visit_count(p_deal_id uuid) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.deal_visits where deal_id = p_deal_id;
$$;

-- Audience de ses propres bons plans (l'auteur est exclu des totaux).
create or replace function public.my_deal_audience()
returns table (deal_id uuid, views integer, visits integer, favorites integer, confirmations integer, reports integer)
language sql stable security definer set search_path = public as $$
  select d.id,
    (select count(*)::int from public.deal_views x where x.deal_id = d.id),
    (select count(*)::int from public.deal_visits x where x.deal_id = d.id),
    (select count(*)::int from public.favorites f where f.deal_id = d.id and f.user_id <> d.author_id),
    (select count(*)::int from public.votes v where v.deal_id = d.id and v.value = 1 and v.user_id <> d.author_id),
    (select count(*)::int from public.votes v where v.deal_id = d.id and v.value = -1 and v.user_id <> d.author_id)
  from public.deals d
  where d.author_id = auth.uid();
$$;

revoke execute on function public.deal_visit_count(uuid), public.my_deal_audience() from public, anon;
grant execute on function public.deal_visit_count(uuid), public.my_deal_audience() to authenticated;
