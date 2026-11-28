"use client";

// Paiement SIMULÉ de la mise en avant (tâche 13) — Justin. La carte affichée est factice et non modifiable :
// aucune donnée bancaire n'est saisie ni envoyée ; seule la base enregistre le reçu (031_boost_payments.sql).
import { useState } from "react";
import { CheckCircleIcon, LockClosedIcon } from "@/components/icons";
import Modal from "@/components/Modal";
import { BOOST_DAYS, BOOST_PRICE, isBoosted, payBoost } from "@/lib/merchant";
import type { BoostPayment, Deal } from "@/lib/types";
import Receipt, { formatDay } from "./Receipt";
import { buttonClass, inputClass } from "./styles";

/** Durée de l'attente simulée, pour que le paiement se voie. */
const PROCESSING_MS = 1200;

export default function PaymentDialog({
  offer,
  onClose,
  onPaid,
}: {
  offer: Deal;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<BoostPayment | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Fin prévue : une mise en avant en cours est prolongée, comme dans la base.
  const [end] = useState(() => {
    const now = Date.now();
    const from = isBoosted(offer, now) ? new Date(offer.boosted_until!).getTime() : now;
    return new Date(from + BOOST_DAYS * 86_400_000).toISOString();
  });

  async function pay() {
    setPaying(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_MS));
      setReceipt(await payBoost(offer.id));
      onPaid();
    } catch (e) {
      setError((e as Error).message);
    }
    setPaying(false);
  }

  return (
    // Pas de fermeture pendant le paiement : le reçu ne serait jamais affiché.
    <Modal label="Paiement de la mise en avant" onClose={() => !paying && onClose()}>
      {receipt ? (
        <div role="status">
          <h2 className="flex items-center gap-2 text-xl">
            <CheckCircleIcon className="h-6 w-6" /> Paiement accepté
          </h2>
          <p className="mt-1 text-sm">
            Ton offre est mise en avant jusqu&apos;au <strong>{formatDay(receipt.boosted_until)}</strong>.
          </p>
          <Receipt payment={receipt} />
          <p className="mt-2 text-xs text-[var(--color-muted)]">Retrouve ce reçu dans « Compte », « Mes paiements ».</p>
          <button type="button" onClick={onClose} className={`${buttonClass} mt-4`}>
            Terminé
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            pay();
          }}
        >
          <h2 className="text-xl">Mettre en avant</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            En tête du fil et repère doré sur la carte pendant {BOOST_DAYS} jours.
          </p>

          <dl className="sw-card mt-3 divide-y divide-[var(--color-border)] text-sm">
            {[
              ["Offre", offer.title],
              ["Jusqu'au", formatDay(end)],
              ["Total", BOOST_PRICE],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 p-3">
                <dt className="text-[var(--color-muted)]">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-3 rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: "var(--color-lilac)" }}>
            <strong>Démonstration</strong> : carte de test, aucun argent n&apos;est débité.
          </p>

          <label className="mt-3 block text-sm font-medium">
            Numéro de carte
            <input readOnly value="4242 4242 4242 4242" className={inputClass} />
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block text-sm font-medium">
              Expiration
              <input readOnly value="12 / 30" className={inputClass} />
            </label>
            <label className="block text-sm font-medium">
              Cryptogramme
              <input readOnly value="123" className={inputClass} />
            </label>
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={paying} className={`${buttonClass} mt-4 flex items-center justify-center gap-1.5`}>
            <LockClosedIcon className="h-4 w-4" /> {paying ? "Paiement en cours…" : `Payer ${BOOST_PRICE}`}
          </button>
        </form>
      )}
    </Modal>
  );
}
