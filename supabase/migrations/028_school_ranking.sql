-- ShareWood — compétition entre écoles (tâche 70 ; à exécuter après 027 ; relançable sans risque).
-- L'étudiant choisit son école dans une liste (preferences.school_id) ; « Autre » garde le texte libre (preferences.school)
-- et ne compte pas au classement. Classement : Flèches gagnées ces 7 derniers jours ÷ membres actifs (au moins une
-- Flèche gagnée sur la période), seulement pour les écoles d'au moins 3 membres. Seuls des totaux sortent de la base.

create table if not exists public.schools (
  id text primary key,
  name text not null,
  city text not null,
  sort int not null default 0
);
alter table public.schools enable row level security;
drop policy if exists "lire les écoles" on public.schools;
create policy "lire les écoles" on public.schools for select to authenticated using (true);
revoke all on public.schools from anon, authenticated;
grant select on public.schools to authenticated;

insert into public.schools (id, name, city, sort) values
  ('ensai', 'ENSAI', 'Bruz', 1),
  ('univ-rennes', 'Université de Rennes', 'Rennes', 2),
  ('rennes2', 'Université Rennes 2', 'Rennes', 3),
  ('insa', 'INSA Rennes', 'Rennes', 4),
  ('sciencespo', 'Sciences Po Rennes', 'Rennes', 5),
  ('rsb', 'Rennes School of Business', 'Rennes', 6),
  ('ens', 'ENS Rennes', 'Bruz', 7),
  ('enscr', 'École nationale supérieure de chimie de Rennes', 'Rennes', 8),
  ('iut-rennes', 'IUT de Rennes', 'Rennes', 9),
  ('ehesp', 'EHESP', 'Rennes', 10)
on conflict (id) do update set name = excluded.name, city = excluded.city, sort = excluded.sort;

alter table public.preferences add column if not exists school_id text references public.schools on delete set null;

-- Classement des écoles et rang de la sienne. Aucune donnée individuelle : seulement des totaux par école.
create or replace function public.school_ranking() returns json
language sql stable security definer set search_path = public as $$
  with members as (
    select p.user_id, p.school_id
      from public.preferences p
     where p.school_id is not null and public.arrow_is_student(p.user_id)
  ),
  gains as (
    select e.user_id, sum(e.amount)::int as points
      from public.arrow_events e
     where e.paid and e.amount > 0 and e.created_at > now() - interval '7 days'
     group by e.user_id
  ),
  per_school as (
    select s.id, s.name, count(m.user_id)::int as members,
           count(g.user_id)::int as active,
           coalesce(sum(g.points), 0)::int as points
      from public.schools s
      join members m on m.school_id = s.id
      left join gains g on g.user_id = m.user_id
     group by s.id, s.name
    having count(m.user_id) >= 3
  ),
  ranked as (
    select *, round(points::numeric / greatest(active, 1))::int as score,
           rank() over (order by round(points::numeric / greatest(active, 1)) desc, points desc) as rank
      from per_school
  )
  select json_build_object(
    'ranking', coalesce((select json_agg(json_build_object('id', id, 'name', name, 'members', members, 'active', active,
                                                           'points', points, 'score', score, 'rank', rank) order by rank, name)
                           from ranked), '[]'::json),
    'my_school', (select school_id from public.preferences where user_id = auth.uid()),
    'my_members', (select count(*) from members where school_id = (select school_id from public.preferences where user_id = auth.uid()))
  );
$$;
revoke execute on function public.school_ranking() from public, anon;
grant execute on function public.school_ranking() to authenticated;
