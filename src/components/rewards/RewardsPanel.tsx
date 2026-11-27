"use client";

// Onglet « Récompenses » : solde disponible, mes bons, boutique.
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ArrowShotIcon, ChevronDownIcon, TicketIcon } from "@/components/icons";
import Modal from "@/components/rewards/Modal";
import RedeemDialog from "@/components/rewards/RedeemDialog";
import Voucher from "@/components/rewards/Voucher";
import { fetchShop, REWARD_CATEGORIES, type OwnedReward, type Reward } from "@/lib/rewards";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useMyArrows } from "@/lib/useMyArrows";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

type Shop = Awaited<ReturnType<typeof fetchShop>>;

export default function RewardsPanel() {
  const arrows = useMyArrows();
  /** undefined : chargement ; null : boutique pas encore installée */
  const [shop, setShop] = useState<Shop | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [choice, setChoice] = useState<Reward | null>(null);
  const [shown, setShown] = useState<OwnedReward | null>(null);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  // Les fenêtres se referment quand la page est quittée (Next la conserve en mémoire).
  useLayoutEffect(
    () => () => {
      setChoice(null);
      setShown(null);
    },
    [],
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchShop()
      .then((s) => !cancelled && setShop(s))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [version]);

  if (error) return <p role="alert" className="text-sm text-red-600">Boutique indisponible : {error}</p>;
  if (shop === null) return <p className="text-sm text-[var(--color-muted)]">La boutique ouvre bientôt.</p>;
  if (!shop || !arrows) return <p className="text-sm text-[var(--color-muted)]">Chargement de la boutique…</p>;

  const balance = Math.max(0, arrows.current_arrows_balance);
  const vouchers = shop.owned.filter((o) => o.reward.category === "local");
  const active = vouchers.filter((o) => !o.used_at);
  const used = vouchers.filter((o) => o.used_at);
  const tickets = shop.owned.filter((o) => o.reward.category === "raffle");

  const row = (o: OwnedReward) => (
    <li key={o.id}>
      <button type="button" onClick={() => setShown(o)} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
        <TicketIcon className={`h-6 w-6 shrink-0 ${o.used_at ? "text-[var(--color-muted)]" : "text-[var(--color-forest)]"}`} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{o.reward.title}</span>
          <span className="block text-xs text-[var(--color-muted)]">
            {o.reward.partner} · {o.code}
            {o.used_at && ` · utilisé le ${formatDate(o.used_at)}`}
          </span>
        </span>
        <span className="shrink-0 text-sm font-medium" style={{ color: "var(--color-forest)" }}>{o.used_at ? "Voir" : "Afficher"}</span>
      </button>
    </li>
  );

  /** Pourquoi on ne peut pas échanger, ou null. */
  function blocked(r: Reward) {
    if (r.effect === "golden_badge" && arrows!.golden_badge) return "Déjà obtenu";
    if (r.effect === "early_access" && arrows!.early_access_until) return `Actif jusqu'au ${formatDate(arrows!.early_access_until)}`;
    return balance < r.cost ? "Flèches insuffisantes" : null;
  }

  return (
    <div className="space-y-5">
      <p className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-lg font-medium" style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}>
        <ArrowShotIcon className="h-5 w-5" /> <span className="tabular-nums">{balance}</span> Flèches disponibles
      </p>

      {(vouchers.length > 0 || tickets.length > 0) && (
        <section aria-label="Mes bons" className="space-y-2">
          <h2 className="text-lg">Mes bons</h2>
          {active.length > 0 && <ul className="space-y-2">{active.map(row)}</ul>}
          {tickets.length > 0 && (
            <details className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)" }}>
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <span className="flex-1">Tickets de tombola : {tickets.length}</span>
                <ChevronDownIcon className="h-4 w-4 text-[var(--color-muted)]" />
              </summary>
              <ul className="mt-2 space-y-2">{tickets.map(row)}</ul>
            </details>
          )}
          {used.length > 0 && (
            <details className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)" }}>
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <span className="flex-1">Bons déjà utilisés : {used.length}</span>
                <ChevronDownIcon className="h-4 w-4 text-[var(--color-muted)]" />
              </summary>
              <ul className="mt-2 space-y-2">{used.map(row)}</ul>
            </details>
          )}
        </section>
      )}

      <section aria-label="Boutique" className="space-y-2">
        <h2 className="text-lg">Boutique</h2>
        <ul className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-3">
          {shop.rewards.map((r) => {
            const category = REWARD_CATEGORIES[r.category];
            const why = blocked(r);
            const owned = r.category === "raffle" ? tickets.filter((t) => t.reward_id === r.id).length : 0;
            return (
              <li key={r.id} className="flex flex-col gap-1.5 rounded-2xl border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                <span className="sw-badge self-start" style={{ backgroundColor: category.bg, color: category.text }}>{category.label}</span>
                <h3 className="text-base leading-snug">{r.title}</h3>
                <p className="text-xs text-[var(--color-muted)]">{r.partner}</p>
                {owned > 0 && <p className="text-xs font-medium">Tu as {owned} ticket{owned > 1 ? "s" : ""}</p>}
                <p className="mt-auto flex items-center gap-1 pt-1 font-medium tabular-nums" style={{ color: "var(--color-forest)" }}>
                  <ArrowShotIcon className="h-4 w-4" /> {r.cost} <span className="sr-only">Flèches</span>
                </p>
                <button
                  type="button"
                  onClick={() => setChoice(r)}
                  disabled={why !== null}
                  aria-label={`Échanger : ${r.title}`}
                  className="sw-btn-primary w-full text-sm"
                >
                  Échanger
                </button>
                {why && <p className="text-center text-xs text-[var(--color-muted)]">{why}</p>}
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-[var(--color-muted)]">
          Partenaires de démonstration, fictifs. L&apos;Avant-Première est enregistrée sur ton compte ; il n&apos;y a pas encore d&apos;offres flash.
        </p>
      </section>

      {choice && <RedeemDialog reward={choice} balance={balance} onClose={() => setChoice(null)} onChange={reload} />}
      {shown && (
        <Modal label={`Bon ${shown.code}`} onClose={() => setShown(null)}>
          <Voucher reward={shown.reward} owned={shown} onUsed={reload} />
        </Modal>
      )}
    </div>
  );
}
