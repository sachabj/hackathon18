"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { BOOST_DAYS, BOOST_PRICE, isBoosted } from "@/lib/merchant";
import type { Deal, OfferStats } from "@/lib/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

const actionClass = "rounded-full border px-3 py-1.5 text-sm font-semibold disabled:opacity-50";

/** Une offre du commerçant : état, statistiques et actions. */
export default function OfferCard({
  offer,
  stats,
  busy,
  onEdit,
  onToggleEnded,
  onBoost,
}: {
  offer: Deal;
  stats?: OfferStats;
  busy: boolean;
  onEdit: () => void;
  onToggleEnded: () => void;
  onBoost: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const [now] = useState(() => Date.now());
  const expired = !!offer.expires_at && new Date(offer.expires_at).getTime() < now;
  const online = !offer.ended_by_merchant && !expired;
  const boosted = online && isBoosted(offer, now);

  return (
    <article className={`rounded-2xl border bg-white p-3 shadow-sm ${boosted ? "border-amber-400" : "border-zinc-200"} ${online ? "" : "opacity-70"}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug">
          {CATEGORIES[offer.category].emoji} {offer.title}
        </h3>
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${online ? "bg-green-100 text-green-800" : "bg-zinc-200 text-zinc-600"}`}>
          {online ? "En ligne" : expired ? "Expirée" : "Retirée"}
        </span>
      </div>
      <p className="text-sm text-zinc-500">
        {[offer.price_info, offer.expires_at && `jusqu'au ${formatDate(offer.expires_at)}`].filter(Boolean).join(" · ")}
      </p>
      {boosted && (
        <p className="mt-1 text-sm font-semibold text-amber-700">
          ⭐ Mise en avant jusqu&apos;au {formatDate(offer.boosted_until!)}
        </p>
      )}

      <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
        {[
          ["👍 Confirmations", stats?.confirmations],
          ["👎 Signalements", stats?.reports],
          ["❤️ Favoris", stats?.favorites],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-zinc-100 py-1.5">
            <dd className="text-lg font-bold">{value ?? 0}</dd>
            <dt className="text-[11px] text-zinc-500">{label}</dt>
          </div>
        ))}
      </dl>

      {paying ? (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">
          <p>
            Mettre en avant pendant <strong>{BOOST_DAYS} jours</strong> pour <strong>{BOOST_PRICE}</strong> : en tête du fil
            et repère doré sur la carte.
          </p>
          <p className="mt-1 text-xs text-zinc-500">Démonstration : aucun paiement réel n&apos;est effectué.</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setPaying(false);
                onBoost();
              }}
              className={`${actionClass} border-amber-500 bg-amber-500 text-white`}
            >
              Payer {BOOST_PRICE} (simulé)
            </button>
            <button type="button" onClick={() => setPaying(false)} className={`${actionClass} border-zinc-300`}>
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {online && (
            <button type="button" disabled={busy} onClick={() => setPaying(true)} className={`${actionClass} border-amber-400 text-amber-700`}>
              ⭐ {boosted ? "Prolonger" : "Mettre en avant"}
            </button>
          )}
          <button type="button" disabled={busy} onClick={onEdit} className={`${actionClass} border-zinc-300`}>
            ✏️ Modifier
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onToggleEnded}
            className={`${actionClass} ${offer.ended_by_merchant ? "border-green-300 text-green-700" : "border-red-300 text-red-600"}`}
          >
            {offer.ended_by_merchant ? "↩️ Remettre en ligne" : "🚫 N'existe plus"}
          </button>
        </div>
      )}
    </article>
  );
}
