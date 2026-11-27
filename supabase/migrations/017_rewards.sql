-- ShareWood — boutique de récompenses (à exécuter après 016_arrows.sql ; relançable sans risque).
--
-- Double compteur, calculé par la base (rien à resynchroniser) :
--   total_arrows_earned    = Flèches gagnées (sert au rang : dépenser ne fait jamais rétrograder)
--   current_arrows_balance = gagnées − dépensées (sert à échanger)
-- Si des gains sont retirés après un échange (vote décoché…), le solde devient négatif : il faut regagner.

-- Avantages dans l'application (non écrivables par l'app).
alter table public.profiles add column if not exists golden_badge boolean not null default false;
alter table public.profiles add column if not exists early_access_until timestamptz;

-- Catalogue.
create table if not exists public.rewards (
  id text primary key,
  category text not null check (category in ('local', 'app', 'raffle')),
  title text not null,
  partner text not null,
  description text not null,
  cost int not null check (cost > 0),
  effect text check (effect in ('early_access', 'golden_badge')),
  sort int not null default 0,
  active boolean not null default true,
  check ((category = 'app') = (effect is not null))
);

-- Échanges : un bon (code unique), un ticket de tombola ou un avantage activé.
create table if not exists public.user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  reward_id text not null references public.rewards,
  cost int not null check (cost > 0),          -- prix payé
  code text unique,                            -- null : avantage dans l'application
  created_at timestamptz not null default now(),
  used_at timestamptz                          -- bon présenté en caisse
);
create index if not exists user_rewards_user_idx on public.user_rewards (user_id, created_at desc);

alter table public.rewards enable row level security;
alter table public.user_rewards enable row level security;
drop policy if exists "catalogue lisible" on public.rewards;
create policy "catalogue lisible" on public.rewards for select to authenticated using (true);
drop policy if exists "lire ses récompenses" on public.user_rewards;
create policy "lire ses récompenses" on public.user_rewards for select to authenticated using (user_id = auth.uid());
revoke all on public.rewards, public.user_rewards from anon, authenticated;
grant select on public.rewards, public.user_rewards to authenticated;

-- Partenaires FICTIFS, marqués « (démo) » : aucun accord réel.
insert into public.rewards (id, category, title, partner, description, cost, effect, sort) values
  ('cafe', 'local', '1 café offert', 'Café des Étangs (démo)',
   'Un café offert sur place, sur présentation du bon.', 100, null, 1),
  ('kebab', 'local', '1 boisson ou dessert offert', 'Kebab du Coin (démo)',
   'Pour l''achat d''un menu : une boisson ou un dessert au choix.', 150, null, 2),
  ('resto', 'local', '-20 % sur l''addition', 'Pizzeria des Deux Rives (démo)',
   '20 % de réduction sur une addition, pour une personne.', 250, null, 3),
  ('early', 'app', 'Accès Avant-Première', 'ShareWood',
   'Pendant 7 jours, les offres flash ou limitées 1 h avant tout le monde.', 200, 'early_access', 4),
  ('golden', 'app', 'Badge Doré', 'ShareWood',
   'Un badge doré sur ton profil, pour toujours.', 300, 'golden_badge', 5),
  ('tombola', 'raffle', 'Ticket tombola : 2 places de ciné ou 20 €', 'Tirage ShareWood (démo)',
   'Un ticket par échange, autant de tickets que tu veux.', 50, null, 6)
on conflict (id) do update set
  category = excluded.category, title = excluded.title, partner = excluded.partner,
  description = excluded.description, cost = excluded.cost, effect = excluded.effect, sort = excluded.sort;

create or replace function public.arrows_balance(p_user uuid) returns int
language sql stable security definer set search_path = public as $$
  select (coalesce((select sum(amount) from public.arrow_events where user_id = p_user and paid), 0)
        - coalesce((select sum(cost) from public.user_rewards where user_id = p_user), 0))::int;
$$;

-- Échange : vérification du solde, dépense et avantage en une seule opération.
create or replace function public.redeem_reward(p_reward_id text) returns public.user_rewards
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  r public.rewards;
  p public.profiles;
  balance int;
  new_code text;
  result public.user_rewards;
begin
  if not public.arrow_is_student(me) then
    raise exception 'La boutique est réservée aux comptes étudiants.';
  end if;
  -- Même verrou que les votes : deux échanges simultanés ne dépensent pas deux fois le même solde.
  perform pg_advisory_xact_lock(hashtextextended('arrows-user:' || me, 0));
  select * into r from public.rewards where id = p_reward_id and active;
  if not found then
    raise exception 'Cette récompense n''est plus proposée.';
  end if;
  select * into p from public.profiles where id = me;
  if r.effect = 'golden_badge' and p.golden_badge then
    raise exception 'Tu as déjà le Badge Doré.';
  end if;
  if r.effect = 'early_access' and p.early_access_until > now() then
    raise exception 'Ton Accès Avant-Première est encore actif.';
  end if;
  balance := public.arrows_balance(me);
  if balance < r.cost then
    raise exception 'Flèches insuffisantes : il t''en manque %.', r.cost - balance;
  end if;

  if r.effect is null then
    -- Code aléatoire « SW-XXXXXX » ; on retire en cas de doublon.
    loop
      new_code := 'SW-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      exit when not exists (select 1 from public.user_rewards where code = new_code);
    end loop;
  end if;
  insert into public.user_rewards (user_id, reward_id, cost, code) values (me, r.id, r.cost, new_code)
    returning * into result;

  if r.effect = 'golden_badge' then
    update public.profiles set golden_badge = true where id = me;
  elsif r.effect = 'early_access' then
    update public.profiles set early_access_until = now() + interval '7 days' where id = me;
  end if;
  return result;
end $$;

-- « Marquer comme utilisé en caisse » : seulement ses bons commerçants, une seule fois.
create or replace function public.use_reward(p_id uuid) returns public.user_rewards
language plpgsql security definer set search_path = public as $$
declare
  result public.user_rewards;
begin
  update public.user_rewards u set used_at = now()
   where u.id = p_id and u.user_id = auth.uid() and u.used_at is null
     and exists (select 1 from public.rewards r where r.id = u.reward_id and r.category = 'local')
  returning * into result;
  if result.id is null then
    raise exception 'Ce bon est introuvable ou déjà utilisé.';
  end if;
  return result;
end $$;

-- Remplace la version de 016 : double compteur, avantages actifs et dépenses dans l'historique.
create or replace function public.my_arrows() returns json
language sql stable security definer set search_path = public as $$
  with earned as (
    select coalesce(sum(amount) filter (where paid), 0)::int as total,
           coalesce(sum(amount) filter (where not paid), 0)::int as pending,
           (count(*) filter (where kind in ('confirm', 'report')
              and public.arrow_day(created_at) = public.arrow_day(now())))::int as today_votes
    from public.arrow_events where user_id = auth.uid()
  )
  select json_build_object(
    'total', e.total,
    'total_arrows_earned', e.total,
    'current_arrows_balance', public.arrows_balance(auth.uid()),
    'pending', e.pending,
    'streak', public.arrow_streak(auth.uid(), public.arrow_day(now())),
    'today_votes', e.today_votes,
    'golden_badge', coalesce(p.golden_badge, false),
    'early_access_until', case when p.early_access_until > now() then p.early_access_until end,
    'history', coalesce((
      select json_agg(h order by h.created_at desc) from (
        select * from (
          select 'g' || a.id as id, a.kind, a.amount, a.multiplier, a.paid, a.created_at, d.title
          from public.arrow_events a left join public.deals d on d.id = a.deal_id
          where a.user_id = auth.uid()
          union all
          select 's' || u.id, 'spend', -u.cost, 1, true, u.created_at, r.title
          from public.user_rewards u join public.rewards r on r.id = u.reward_id
          where u.user_id = auth.uid()
        ) all_moves
        order by created_at desc, id desc limit 15
      ) h), '[]'::json)
  )
  from earned e left join public.profiles p on p.id = auth.uid();
$$;

revoke execute on function public.arrows_balance(uuid) from public, anon, authenticated;
revoke execute on function public.redeem_reward(text), public.use_reward(uuid), public.my_arrows() from public, anon;
grant execute on function public.redeem_reward(text), public.use_reward(uuid), public.my_arrows() to authenticated;
