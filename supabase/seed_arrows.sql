-- =====================================================================
-- ShareWood — données de démo « Les Flèches », récompenses et profil (étudiants aidés, parrainage).
-- Prérequis : migrations 016_arrows.sql, 017_rewards.sql, 020_location_rules.sql et
-- 022_profile_impact_referral.sql et 023_doubtful_deals.sql, puis reset_demo.sql (comptes demo.…@example.com).
-- ⚠️ À lancer le jour de la démo : les séries sont calculées à partir de la date d'exécution.
-- À coller dans Supabase → SQL Editor → Run. Ne touche qu'aux comptes de démo et à trois de leurs offres.
-- Relançable : remet les scénarios à zéro (utile après une répétition). Historique INVENTÉ.
--
-- Comptes préparés (mot de passe : celui choisi dans reset_demo.sql) ; Flèches gagnées, qui fixent le rang :
--   demo.lea     Robin des Étudiants      680, série 5 jours ; 430 disponibles, un bon actif et un utilisé
--   demo.hugo    Robin des Étudiants      510
--   demo.sarah   Chasseur de bons plans   490, série 2 jours  → compte conseillé pour la démo en direct
--   demo.ines    Chasseur de bons plans   300, série 3 jours
--   demo.malo    Chasseur de bons plans   150
--   demo.tom     Éclaireur                 60
--
-- En direct, connecté en demo.sarah (la série passe à 3 jours : gains × 1,5) :
--   1. « Carte Avantage Jeune » : J'en ai profité → +5 (495) ;
--      3e confirmation, son auteur (demo.hugo) gagne le bonus (+10).
--   2. « Covoiturage Bruz → Rennes » (« Douteux », 5 signalements récents) : Plus dispo → 6e en 48 h,
--      offre retirée, +5 : elle passe Robin des Étudiants (500).
--   3. Ciblés → Récompenses : échanger « 1 boisson ou dessert offert » (150) → 350 disponibles,
--      le rang ne bouge pas ; montrer le bon, puis « Marquer comme utilisé en caisse ».
-- Les offres des étapes 1 et 2 sont sans lieu précis : petits montants, et la position ne change rien.
--
-- Profil de demo.sarah (INVENTÉ) : ENSAI, code WOOD-SARAH26, 3 amis parrainés (300 Flèches, comprises dans
-- ses 490) et 42 étudiants aidés (30 par ses offres, 12 par ses liens partagés). Pour cela, 42 comptes
-- « demo.publicNN » sans mot de passe sont créés (personne ne peut s'y connecter).
-- =====================================================================
do $seed$
declare
  bonus_deal uuid;
  report_deal uuid;
  archived_deal uuid;
  p record;
  uid uuid;
  own_deals uuid[];
  other_deals uuid[];
  total_events int;
  i int;
  k text;
  day_back int;
  deal uuid;
  used_own int;
  used_other int;
begin
  if to_regclass('public.arrow_events') is null or to_regclass('public.user_rewards') is null
     or to_regprocedure('public.claim_creation_arrows(uuid, float8, float8)') is null
     or to_regclass('public.referrals') is null or to_regprocedure('public.settle_doubtful_deals()') is null then
    raise exception 'Lance d''abord les migrations 016, 017, 020, 022 et 023_doubtful_deals.sql.';
  end if;
  if not exists (select 1 from auth.users where email = 'demo.sarah@example.com') then
    raise exception 'Lance d''abord supabase/reset_demo.sql (comptes de démo absents).';
  end if;

  select id into bonus_deal from public.deals where title ilike '%Carte Avantage Jeune%'
     and author_id in (select id from auth.users where email like 'demo.%') order by created_at limit 1;
  select id into report_deal from public.deals where title ilike '%Covoiturage Bruz%'
     and author_id in (select id from auth.users where email like 'demo.%') order by created_at limit 1;
  select d.id into archived_deal from public.deals d join auth.users a on a.id = d.author_id
   where a.email = 'demo.sarah@example.com' and d.id not in (bonus_deal, report_deal) order by d.title limit 1;
  if bonus_deal is null or report_deal is null or archived_deal is null then
    raise exception 'Offres de démo introuvables : relance supabase/reset_demo.sql.';
  end if;

  -- ---------- Votes des trois scénarios ----------
  delete from public.votes where deal_id in (bonus_deal, report_deal, archived_deal);
  -- Un retrait est définitif dans l'application : le script, lui, remet les trois offres à zéro.
  update public.deals set archived_at = null, doubtful_since = null, reports_reset_at = null
   where id in (bonus_deal, report_deal, archived_deal);
  insert into public.votes (deal_id, user_id, value)
  select v.deal, a.id, v.value
  from (values
    (bonus_deal, 'demo.lea@example.com', 1), (bonus_deal, 'demo.ines@example.com', 1),
    -- Cinq signalements : « Douteux » ; le sixième, en direct, la retire.
    (report_deal, 'demo.lea@example.com', -1), (report_deal, 'demo.ines@example.com', -1),
    (report_deal, 'demo.tom@example.com', -1), (report_deal, 'demo.yanis@example.com', -1),
    (report_deal, 'demo.chloe@example.com', -1),
    -- Six signalements : déjà retirée.
    (archived_deal, 'demo.lea@example.com', -1), (archived_deal, 'demo.hugo@example.com', -1),
    (archived_deal, 'demo.ines@example.com', -1), (archived_deal, 'demo.tom@example.com', -1),
    (archived_deal, 'demo.yanis@example.com', -1), (archived_deal, 'demo.malo@example.com', -1)
  ) as v(deal, email, value)
  join auth.users a on a.email = v.email;

  -- Les parrainages sont refaits plus bas (supprimés ici pour que l'historique ne les verse pas deux fois).
  delete from public.referrals where referrer_id in (select id from auth.users where email like 'demo.%@example.com')
     or referee_id in (select id from auth.users where email like 'demo.%@example.com');

  -- ---------- Historique des six comptes ----------
  delete from public.arrow_events where user_id in (select id from auth.users where email like 'demo.%@example.com');
  delete from public.activity_days where user_id in (select id from auth.users where email like 'demo.%@example.com');
  delete from public.user_rewards where user_id in (select id from auth.users where email like 'demo.%@example.com');
  update public.profiles set golden_badge = false, early_access_until = null
   where id in (select id from auth.users where email like 'demo.%@example.com');

  for p in
    select * from (values
      -- adresse, créations (50), bonus (30), confirmations (10), signalements (10), jours de série
      ('demo.lea@example.com',   10, 2, 12, 0, 5),
      ('demo.hugo@example.com',   8, 0,  9, 2, 1),
      ('demo.ines@example.com',   4, 0,  8, 2, 3),
      ('demo.malo@example.com',   2, 0,  5, 0, 0),
      ('demo.sarah@example.com',  2, 0,  8, 1, 2),
      ('demo.tom@example.com',    1, 0,  1, 0, 0)
    ) as t(email, creates, bonuses, confirms, reports, streak)
  loop
    select id into uid from auth.users where email = p.email;
    select coalesce(array_agg(id order by title, id), '{}') into own_deals from public.deals
     where author_id = uid and id not in (bonus_deal, report_deal, archived_deal);
    select coalesce(array_agg(id order by md5(id::text || p.email)), '{}') into other_deals from public.deals
     where author_id is distinct from uid and id not in (bonus_deal, report_deal, archived_deal);
    total_events := p.creates + p.bonuses + p.confirms + p.reports;
    used_own := 0;
    used_other := 0;
    for i in 1 .. total_events loop
      k := case
        when i <= p.creates then 'create'
        when i <= p.creates + p.bonuses then 'bonus'
        when i <= p.creates + p.bonuses + p.confirms then 'confirm'
        else 'report' end;
      -- Les « streak » premiers gains tombent la veille et les jours précédents, les autres plus tôt
      -- (jamais aujourd'hui : le plafond du jour reste entier pour la démo).
      day_back := case when i <= p.streak then i else p.streak + 2 + (i % 9) end;
      if k = 'create' then
        used_own := used_own + 1;
        deal := own_deals[used_own];
      elsif k = 'bonus' then
        deal := own_deals[i - p.creates];
      else
        used_other := used_other + 1;
        deal := other_deals[used_other];
      end if;
      insert into public.arrow_events (user_id, deal_id, kind, base, amount, created_at)
      select uid, deal, k, b, b, now() - make_interval(days => day_back, mins => i)
      from (select case k when 'create' then 50 when 'bonus' then 30 when 'confirm' then 10 else 10 end as b) x;
      insert into public.activity_days (user_id, day)
        values (uid, public.arrow_day(now()) - day_back) on conflict do nothing;
    end loop;
  end loop;

  -- Signalements déjà faits sur l'offre à retirer en direct : en attente du retrait.
  insert into public.arrow_events (user_id, deal_id, kind, base, amount, paid, created_at)
  select a.id, report_deal, 'report', 3, 3, false, now() - interval '2 days'
  from auth.users a where a.email in ('demo.lea@example.com', 'demo.ines@example.com');

  -- Deux bons de demo.lea : un déjà utilisé, un à présenter.
  insert into public.user_rewards (user_id, reward_id, cost, code, created_at, used_at)
  select a.id, v.reward, v.cost, v.code, now() - v.since, now() - v.used
  from (values
    ('cafe', 100, 'SW-DEMO01', interval '6 days', interval '5 days'),
    ('kebab', 150, 'SW-DEMO02', interval '2 days', null::interval)
  ) as v(reward, cost, code, since, used)
  join auth.users a on a.email = 'demo.lea@example.com';

  -- ---------- Profil de demo.sarah : école, code et trois amis parrainés (inventés) ----------
  select id into uid from auth.users where email = 'demo.sarah@example.com';
  insert into public.preferences (user_id, school) values (uid, 'ENSAI')
    on conflict (user_id) do update set school = excluded.school;
  delete from public.referral_codes where user_id = uid or referral_code = 'WOOD-SARAH26';
  insert into public.referral_codes (user_id, referral_code) values (uid, 'WOOD-SARAH26');
  i := 0;
  for p in
    select a.id from auth.users a
     where a.email in ('demo.yanis@example.com', 'demo.chloe@example.com', 'demo.nolan@example.com') order by a.email
  loop
    i := i + 1;
    insert into public.referrals (referee_id, referrer_id, created_at, rewarded_at, referrer_paid)
      values (p.id, uid, now() - make_interval(days => 6 + i), now() - make_interval(days => 5 + i), true);
    insert into public.arrow_events (user_id, kind, base, amount, created_at)
      values (uid, 'referral', 100, 100, now() - make_interval(days => 5 + i)),
             (p.id, 'welcome', 50, 50, now() - make_interval(days => 5 + i));
  end loop;

  -- ---------- 42 étudiants aidés par demo.sarah (inventés) ----------
  for i in 1 .. 42 loop
    if not exists (select 1 from auth.users where email = format('demo.public%s@example.com', lpad(i::text, 2, '0'))) then
      deal := gen_random_uuid(); -- identifiant du nouveau compte
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token)
      values ('00000000-0000-0000-0000-000000000000', deal, 'authenticated', 'authenticated',
        format('demo.public%s@example.com', lpad(i::text, 2, '0')), '', now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('username', format('Étudiant %s (démo)', i), 'account_type', 'student'),
        now(), now(), '', '', '', '');
    end if;
  end loop;
  select coalesce(array_agg(id order by title, id), '{}') into own_deals from public.deals where author_id = uid;
  delete from public.deal_shares where sharer_id = uid or deal_id = any (own_deals);
  delete from public.deal_directions where deal_id = any (own_deals);
  delete from public.favorites where user_id in (select id from auth.users where email like 'demo.public%@example.com');
  -- Par ses offres : on complète jusqu'à 30 personnes (favoris puis « Y aller »).
  select 30 - count(*) into total_events from (
    select user_id from public.votes where deal_id = any (own_deals) and value = 1 and user_id <> uid
    union select user_id from public.deal_visits where deal_id = any (own_deals) and user_id <> uid
    union select user_id from public.favorites where deal_id = any (own_deals) and user_id <> uid
  ) helped;
  i := 0;
  for p in select a.id from auth.users a where a.email like 'demo.public%@example.com' order by a.email loop
    i := i + 1;
    deal := own_deals[1 + i % cardinality(own_deals)];
    if i <= greatest(total_events, 0) then
      if i % 2 = 0 then
        insert into public.favorites (user_id, deal_id) values (p.id, deal) on conflict do nothing;
      else
        insert into public.deal_directions (deal_id, user_id) values (deal, p.id) on conflict do nothing;
      end if;
    elsif i <= greatest(total_events, 0) + 12 then
      -- Par ses partages : 12 autres personnes ouvrent un lien vers l'offre d'un autre.
      select id into bonus_deal from public.deals where author_id is distinct from uid order by title, id limit 1;
      insert into public.deal_shares (deal_id, sharer_id, viewer_id) values (bonus_deal, uid, p.id)
        on conflict do nothing;
    end if;
  end loop;
end
$seed$;

-- Contrôle : Flèches gagnées, solde disponible et série de chaque compte préparé.
select a.email, coalesce(sum(e.amount) filter (where e.paid), 0) as fleches,
       public.arrows_balance(a.id) as disponibles,
       coalesce(sum(e.amount) filter (where not e.paid), 0) as en_attente,
       public.arrow_streak(a.id, public.arrow_day(now())) as serie
from auth.users a left join public.arrow_events e on e.user_id = a.id
where a.email in ('demo.lea@example.com','demo.hugo@example.com','demo.ines@example.com',
                  'demo.malo@example.com','demo.sarah@example.com','demo.tom@example.com')
group by a.id, a.email order by fleches desc;
