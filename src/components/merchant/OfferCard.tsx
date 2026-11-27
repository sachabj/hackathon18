"use client";

import { useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";
import { EditIcon, HeartIcon, ProhibitedIcon, StarIcon, ThumbsDownIcon, ThumbsUpIcon, UndoIcon } from "@/components/icons";
import { BOOST_DAYS, BOOST_PRICE, isBoosted } from "@/lib/merchant";
import type { Deal, OfferStats } from "@/lib/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

const actionClass = "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium disabled:opacity-50";

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
    <article className={`sw-card p-3 ${online ? "" : "opacity-70"}`} style={boosted ? { borderColor: "#d4a017", borderWidth: 2 } : undefined}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex items-center gap-1.5 font-medium leading-snug">
          <CategoryIcon category={offer.category} size={20} /> {offer.title}
        </h3>
        <span
          className="shrink-0 rounded-full px-2 py-1 text-xs font-medium"
          style={
            online
              ? { backgroundColor: "var(--color-sage)", color: "var(--color-forest)" }
              : { backgroundColor: "var(--color-border)", color: "var(--color-muted)" }
          }
        >
          {online ? "En ligne" : expired ? "Expirée" : "Retirée"}
        </span>
      </div>
      <p className="text-sm text-[var(--color-muted)]">
        {[offer.price_info, offer.expires_at && `jusqu'au ${formatDate(offer.expires_at)}`].filter(Boolean).join(" · ")}
      </p>
      {boosted && (
        <p className="mt-1 flex items-center gap-1 text-sm font-medium" style={{ color: "#92700c" }}>
          <StarIcon className="h-4 w-4" filled /> Mise en avant jusqu&apos;au {formatDate(offer.boosted_until!)}
        </p>
      )}

      <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
        {(
          [
            [ThumbsUpIcon, "Confirmations", stats?.confirmations],
            [ThumbsDownIcon, "Signalements", stats?.reports],
            [HeartIcon, "Favoris", stats?.favorites],
          ] as const
        ).map(([Icon, label, value]) => (
          <div key={label} className="rounded-xl py-1.5" style={{ backgroundColor: "var(--color-paper)" }}>
            <dd className="text-lg font-bold">{value ?? 0}</dd>
            <dt className="flex items-center justify-center gap-1 text-[11px] text-[var(--color-muted)]">
              <Icon className="h-3 w-3" /> {label}
            </dt>
          </div>
        ))}
      </dl>

      {paying ? (
        <div className="mt-3 rounded-xl p-3 text-sm" style={{ backgroundColor: "var(--color-lilac)" }}>
          <p>
            Mettre en avant pendant <strong>{BOOST_DAYS} jours</strong> pour <strong>{BOOST_PRICE}</strong> : en tête du fil
            et repère doré sur la carte.
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">Démonstration : aucun paiement réel n&apos;est effectué.</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setPaying(false);
                onBoost();
              }}
              className="sw-btn-primary py-1.5 text-sm"
              style={{ backgroundColor: "#92700c" }}
            >
              Payer {BOOST_PRICE} (simulé)
            </button>
            <button type="button" onClick={() => setPaying(false)} className="sw-btn-secondary py-1.5 text-sm">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {online && (
            <button type="button" disabled={busy} onClick={() => setPaying(true)} className={actionClass} style={{ borderColor: "#d4a017", color: "#92700c" }}>
              <StarIcon className="h-4 w-4" /> {boosted ? "Prolonger" : "Mettre en avant"}
            </button>
          )}
          <button type="button" disabled={busy} onClick={onEdit} className={actionClass} style={{ borderColor: "var(--color-border)" }}>
            <EditIcon className="h-4 w-4" /> Modifier
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onToggleEnded}
            className={actionClass}
            style={offer.ended_by_merchant ? { borderColor: "var(--color-forest)", color: "var(--color-forest)" } : { borderColor: "#fca5a5", color: "#dc2626" }}
          >
            {offer.ended_by_merchant ? (
              <>
                <UndoIcon className="h-4 w-4" /> Remettre en ligne
              </>
            ) : (
              <>
                <ProhibitedIcon className="h-4 w-4" /> N&apos;existe plus
              </>
            )}
          </button>
        </div>
      )}
    </article>
  );
}
