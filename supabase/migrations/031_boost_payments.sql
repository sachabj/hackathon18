-- ShareWood — paiement de la mise en avant (tâche 13 ; à exécuter après 005 ; relançable sans risque).
-- Le paiement reste SIMULÉ (aucune carte, aucun débit), mais chaque mise en avant passe désormais par un
-- paiement enregistré, avec son reçu. boost_offer n'est plus appelable par l'application.
-- Relancer ce fichier si 005 est relancée.

create table if not exists public.boost_payments (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.profiles on delete cascade,
  -- Le reçu reste lisible si l'offre est supprimée : titre recopié.
  deal_id uuid references public.deals on delete set null,
  offer_title text not null,
  amount_cents integer not null check (amount_cents > 0),
  receipt_number text not null unique,
  boosted_until timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists boost_payments_merchant on public.boost_payments (merchant_id, created_at desc);

alter table public.boost_payments enable row level security;
drop policy if exists "ses paiements" on public.boost_payments;
create policy "ses paiements" on public.boost_payments for select to authenticated using (merchant_id = auth.uid());
revoke all on public.boost_payments from anon, authenticated;
grant select on public.boost_payments to authenticated; -- écriture : uniquement via pay_boost()

-- Paiement simulé de 9,90 € : active (ou prolonge) la mise en avant et renvoie le reçu.
create or replace function public.pay_boost(p_deal_id uuid) returns public.boost_payments
language plpgsql security definer set search_path = public as $$
declare
  until timestamptz;
  receipt public.boost_payments;
begin
  -- Contrôles (sa propre offre officielle, en ligne) et durée : ceux de boost_offer.
  until := public.boost_offer(p_deal_id);
  insert into public.boost_payments (merchant_id, deal_id, offer_title, amount_cents, receipt_number, boosted_until)
  select auth.uid(), d.id, d.title, 990,
         'REC-' || to_char(now() at time zone 'Europe/Paris', 'YYYYMMDD') || '-'
           || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
         until
    from public.deals d where d.id = p_deal_id
  returning * into receipt;
  return receipt;
end $$;

revoke execute on function public.pay_boost(uuid) from public, anon;
grant execute on function public.pay_boost(uuid) to authenticated;
revoke execute on function public.boost_offer(uuid) from public, anon, authenticated;
