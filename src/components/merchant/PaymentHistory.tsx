"use client";

// « Mes paiements » (page Compte du commerçant) : un reçu par mise en avant, dépliable.
import { useEffect, useState } from "react";
import { fetchPayments, formatPrice } from "@/lib/merchant";
import type { BoostPayment } from "@/lib/types";
import Receipt, { formatDay } from "./Receipt";

export default function PaymentHistory() {
  const [payments, setPayments] = useState<BoostPayment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Relu à chaque retour sur la page.
  useEffect(() => {
    let cancelled = false;
    fetchPayments()
      .then((p) => {
        if (cancelled) return;
        setPayments(p);
        setError(null);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mt-6">
      <h2 className="text-lg">Mes paiements</h2>
      {error && (
        <p role="alert" className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {!payments && !error && <p className="mt-2 text-sm text-[var(--color-muted)]">Chargement…</p>}
      {payments?.length === 0 && <p className="mt-2 text-sm text-[var(--color-muted)]">Aucun paiement pour le moment.</p>}
      <ul className="mt-2 space-y-2">
        {payments?.map((payment) => (
          <li key={payment.id}>
            <details className="sw-card p-3 text-sm">
              <summary className="flex cursor-pointer justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{payment.offer_title}</span>
                  <span className="text-[var(--color-muted)]">{formatDay(payment.created_at)}</span>
                </span>
                <strong className="shrink-0">{formatPrice(payment.amount_cents)}</strong>
              </summary>
              <Receipt payment={payment} />
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
