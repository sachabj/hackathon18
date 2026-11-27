"use client";

// Espace commerçant — statistiques des offres (Justin)
import MerchantPage from "@/components/merchant/MerchantPage";
import OfferChart from "@/components/merchant/OfferChart";
import { METRICS, summarize, type Metric } from "@/lib/offerStats";
import { useDashboard } from "@/lib/useDashboard";

export default function Page() {
  const { data, error } = useDashboard();
  const summary = data ? summarize(data.offers, data.stats, data.fetchedAt) : null;
  const noReaction = summary && Object.values(summary.totals).every((v) => v === 0);

  return (
    <MerchantPage title="Statistiques" business={data ? data.business : undefined} error={error}>
      {summary && summary.rows.length === 0 && (
        <p className="mt-4 text-sm text-[var(--color-muted)]">Publie une première offre pour voir ses statistiques.</p>
      )}
      {summary && summary.rows.length > 0 && (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
            {[
              { label: "Offres en ligne", value: `${summary.online} / ${summary.rows.length}`, Icon: null },
              {
                label: "Confirmations (« J’en ai profité »)",
                value: summary.trust === null ? "—" : `${summary.trust} %`,
                Icon: null,
              },
              ...(Object.keys(METRICS) as Metric[]).map((m) => ({
                label: METRICS[m].label,
                value: String(summary.totals[m]),
                Icon: METRICS[m].Icon,
              })),
            ].map((tile) => (
              <div key={tile.label} className="sw-card flex flex-col-reverse justify-end p-3 last:odd:col-span-2 lg:last:odd:col-span-1">
                <dd className="text-2xl font-bold">{tile.value}</dd>
                <dt className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                  {tile.Icon && <tile.Icon className="h-3.5 w-3.5" />} {tile.label}
                </dt>
              </div>
            ))}
          </dl>

          <section className="mt-6">
            <h2 className="mb-2 text-lg">Comparaison des offres</h2>
            {noReaction ? (
              <p className="text-sm text-[var(--color-muted)]">
                Aucune réaction pour le moment : les votes et les favoris des étudiants apparaîtront ici.
              </p>
            ) : (
              <OfferChart rows={summary.rows} />
            )}
          </section>

          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-medium" style={{ color: "var(--color-forest)" }}>Voir le tableau détaillé</summary>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-[var(--color-muted)]" style={{ borderColor: "var(--color-border)" }}>
                  <th className="py-1 font-medium">Offre</th>
                  {(Object.keys(METRICS) as Metric[]).map((m) => {
                    const Icon = METRICS[m].Icon;
                    return (
                      <th key={m} className="py-1 text-right font-medium" title={METRICS[m].label}>
                        <Icon className="ml-auto h-3.5 w-3.5" />
                        <span className="sr-only">{METRICS[m].label}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((r) => (
                  <tr key={r.offer.id} className="border-b" style={{ borderColor: "var(--color-border)" }}>
                    <td className="py-1.5 pr-2">{r.offer.title}</td>
                    {(Object.keys(METRICS) as Metric[]).map((m) => (
                      <td key={m} className="w-10 py-1.5 text-right tabular-nums">
                        {r[m]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </MerchantPage>
  );
}
