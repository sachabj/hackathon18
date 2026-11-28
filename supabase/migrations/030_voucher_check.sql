-- ShareWood — validation des bons par le commerçant (tâche 42 ; à exécuter après 017 ; relançable sans risque).
-- L'étudiant présente son code (SW-XXXXXX) ; un compte commerçant le vérifie puis le valide. L'étudiant ne peut plus
-- marquer lui-même un bon comme utilisé. Les partenaires de la boutique étant fictifs, tout commerçant peut valider.
-- Le commerçant ne voit que la récompense et l'état du bon : rien sur l'étudiant.

alter table public.user_rewards add column if not exists validated_by uuid references auth.users on delete set null;

-- Vérifier un code sans le valider.
create or replace function public.check_voucher(p_code text) returns json
language plpgsql stable security definer set search_path = public as $$
declare
  v record;
begin
  if not public.is_merchant() then
    raise exception 'Réservé aux comptes commerçants.';
  end if;
  select u.code, u.created_at, u.used_at, r.title, r.partner, r.category
    into v
    from public.user_rewards u join public.rewards r on r.id = u.reward_id
   where u.code = upper(trim(p_code));
  if not found or v.category <> 'local' then
    return null;
  end if;
  return json_build_object('code', v.code, 'title', v.title, 'partner', v.partner,
                           'created_at', v.created_at, 'used_at', v.used_at);
end $$;

-- Valider un bon : une seule fois.
create or replace function public.validate_voucher(p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare
  done public.user_rewards;
begin
  if not public.is_merchant() then
    raise exception 'Réservé aux comptes commerçants.';
  end if;
  update public.user_rewards u set used_at = now(), validated_by = auth.uid()
   where u.code = upper(trim(p_code)) and u.used_at is null
     and exists (select 1 from public.rewards r where r.id = u.reward_id and r.category = 'local')
  returning * into done;
  if done.id is null then
    if exists (select 1 from public.user_rewards where code = upper(trim(p_code)) and used_at is not null) then
      raise exception 'Ce bon a déjà été utilisé.';
    end if;
    raise exception 'Code inconnu : vérifie les caractères (SW- suivi de 6 caractères).';
  end if;
  return public.check_voucher(done.code);
end $$;

revoke execute on function public.check_voucher(text), public.validate_voucher(text) from public, anon;
grant execute on function public.check_voucher(text), public.validate_voucher(text) to authenticated;

-- L'étudiant ne marque plus lui-même son bon comme utilisé.
revoke execute on function public.use_reward(uuid) from public, anon, authenticated;
