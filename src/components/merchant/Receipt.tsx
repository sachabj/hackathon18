// Reçu d'une mise en avant (paiement simulé) : affiché après le paiement et dans « Mes paiements ».
import { formatPrice } from "@/lib/merchant";
import type { BoostPayment } from "@/lib/types";

export const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default function Receipt({ payment }: { payment: BoostPayment }) {
  return (
    <dl className="sw-card mt-3 divide-y divide-[var(--color-border)] text-sm">
      {[
        ["Reçu", payment.receipt_number],
        ["Offre", payment.offer_title],
        ["Payé le", formatDay(payment.created_at)],
        ["Mise en avant", `jusqu'au ${formatDay(payment.boosted_until)}`],
        ["Montant", `${formatPrice(payment.amount_cents)} (simulé)`],
      ].map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 p-3">
          <dt className="shrink-0 text-[var(--color-muted)]">{label}</dt>
          <dd className="break-words text-right font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
