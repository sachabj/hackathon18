"use client";

// Reçu d'une mise en avant (paiement simulé) : affiché après le paiement et dans « Mes paiements ».
import { formatPrice } from "@/lib/merchant";
import type { BoostPayment } from "@/lib/types";
import { dateLocale, useT } from "@/lib/i18n";

export const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString(dateLocale(), { day: "numeric", month: "long", year: "numeric" });

export default function Receipt({ payment }: { payment: BoostPayment }) {
  const t = useT();
  return (
    <dl className="sw-card mt-3 divide-y divide-[var(--color-border)] text-sm">
      {[
        [t("Reçu"), payment.receipt_number],
        [t("Offre"), payment.offer_title],
        [t("Payé le"), formatDay(payment.created_at)],
        [t("Mise en avant"), t("Jusqu'au {date}", { date: formatDay(payment.boosted_until) })],
        [t("Montant"), t("{price} (simulé)", { price: formatPrice(payment.amount_cents) })],
      ].map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 p-3">
          <dt className="shrink-0 text-[var(--color-muted)]">{label}</dt>
          <dd className="break-words text-right font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
