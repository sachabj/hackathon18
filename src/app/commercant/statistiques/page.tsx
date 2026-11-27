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
        <p className="mt-4 text-sm text-zinc-500">Publie une première offre pour voir ses statistiques.</p>
      )}
      {summary && summary.rows.length > 0 && (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-2">
            {[
              { label: "Offres en ligne", value: `${summary.online} / ${summary.rows.length}` },
              {
                label: "Votes « toujours dispo »",
                value: summary.trust === null ? "—" : `${summary.trust} %`,
              },
              ...(Object.keys(METRICS) as Metric[]).map((m) => ({
                label: `${METRICS[m].emoji} ${METRICS[m].label}`,
                value: String(summary.totals[m]),
              })),
            ].map((tile) => (
              <div key={tile.label} className="flex flex-col-reverse rounded-2xl border border-zinc-200 bg-white p-3 last:odd:col-span-2">
                <dd className="text-2xl font-bold">{tile.value}</dd>
                <dt className="text-xs text-zinc-500">{tile.label}</dt>
              </div>
            ))}
          </dl>

          <section className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">Comparaison des offres</h2>
            {noReaction ? (
              <p className="text-sm text-zinc-500">
                Aucune réaction pour le moment : les votes et les favoris des étudiants apparaîtront ici.
              </p>
            ) : (
              <OfferChart rows={summary.rows} />
            )}
          </section>

          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-semibold text-blue-600">Voir le tableau détaillé</summary>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                  <th className="py-1 font-medium">Offre</th>
                  {(Object.keys(METRICS) as Metric[]).map((m) => (
                    <th key={m} className="py-1 text-right font-medium" title={METRICS[m].label}>
                      <span aria-hidden>{METRICS[m].emoji}</span>
                      <span className="sr-only">{METRICS[m].label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((r) => (
                  <tr key={r.offer.id} className="border-b border-zinc-100">
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
