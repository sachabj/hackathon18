-- ShareWood — limites (à exécuter après 024 ; relançable sans risque).
--   1. Titre d'une offre : 100 caractères au plus (TITLE_MAX dans src/lib/constants.ts).
--   2. Assistant IA : 30 analyses par jour et par compte (AI_DAILY_LIMIT, même fichier).

-- `not valid` : les offres déjà en base ne sont pas contrôlées, seules les nouvelles écritures le sont.
alter table public.deals drop constraint if exists deals_title_length;
alter table public.deals add constraint deals_title_length check (char_length(title) <= 100) not valid;

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  uses int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
-- Chacun lit son compteur (export de ses données) ; personne ne l'écrit depuis l'application.
drop policy if exists "lire son usage de l'assistant" on public.ai_usage;
create policy "lire son usage de l'assistant" on public.ai_usage for select to authenticated using (user_id = auth.uid());
revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;

-- Compte une analyse (jour de Paris) ; false une fois le plafond atteint.
create or replace function public.use_ai_quota() returns boolean
language plpgsql security definer set search_path = public as $$
declare
  used int;
begin
  if auth.uid() is null then
    return false;
  end if;
  insert into public.ai_usage as u (user_id, day, uses)
  values (auth.uid(), (now() at time zone 'Europe/Paris')::date, 1)
  on conflict (user_id, day) do update set uses = u.uses + 1 where u.uses < 30
  returning u.uses into used;
  return used is not null;
end $$;
revoke execute on function public.use_ai_quota() from public, anon;
grant execute on function public.use_ai_quota() to authenticated;
