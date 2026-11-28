-- 029 — Signaler un bon plan (tâche 71, Matteo) : motif + description, distinct de « Plus dispo ».
-- Le signalement masque l'offre pour son auteur seulement ; l'équipe les lit dans Supabase (Table Editor → deal_reports).
-- Relançable. À lancer dans le SQL Editor.

create table if not exists public.deal_reports (
  id bigint generated always as identity primary key,
  deal_id uuid not null references public.deals on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  reason text not null check (reason in ('scam', 'inappropriate', 'wrong_info', 'duplicate', 'other')),
  details text check (details is null or char_length(details) <= 500),
  created_at timestamptz not null default now(),
  unique (deal_id, user_id),
  -- « Autre » demande une explication.
  check (reason <> 'other' or char_length(trim(coalesce(details, ''))) >= 3)
);
create index if not exists deal_reports_deal_idx on public.deal_reports (deal_id);

alter table public.deal_reports enable row level security;
drop policy if exists "lire ses signalements" on public.deal_reports;
create policy "lire ses signalements" on public.deal_reports for select to authenticated using (user_id = auth.uid());
-- Jamais sur son propre bon plan.
drop policy if exists "signaler un bon plan" on public.deal_reports;
create policy "signaler un bon plan" on public.deal_reports for insert to authenticated
  with check (
    user_id = auth.uid()
    and not exists (select 1 from public.deals d where d.id = deal_id and d.author_id = auth.uid())
  );
revoke all on public.deal_reports from anon, authenticated;
grant select on public.deal_reports to authenticated;
grant insert (deal_id, reason, details) on public.deal_reports to authenticated;

-- Garde-fou : 20 signalements par compte et par jour.
create or replace function public.deal_reports_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.deal_reports
       where user_id = new.user_id and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Tu as déjà envoyé 20 signalements aujourd''hui : réessaie demain.';
  end if;
  return new;
end $$;
drop trigger if exists deal_reports_limit on public.deal_reports;
create trigger deal_reports_limit before insert on public.deal_reports
  for each row execute function public.deal_reports_limit();
