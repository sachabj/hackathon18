"use client";

// Boutons « J'en ai profité (n) » / « Plus dispo (n) » autonomes, pour la fenêtre d'un repère sur la carte.
import ReactionBar from "@/components/deal/ReactionBar";
import type { DealWithVotes } from "@/lib/types";
import { useDealReactions } from "@/lib/useDealReactions";
import { useT } from "@/lib/i18n";

export default function QuickReactions({ deal }: { deal: DealWithVotes }) {
  const t = useT();
  const r = useDealReactions(deal);
  if (r.ended) {
    return (
      <p role="status" className="text-sm font-medium" style={{ color: "var(--color-aubergine)" }}>
        {t("Offre terminée.")}
      </p>
    );
  }
  return (
    <div>
      <ReactionBar size="sm" showGain={false} placed={deal.lat !== null && deal.lng !== null} counts={r.counts} reaction={r.reaction} busy={r.busy} own={r.own} onReact={r.react} />
      {r.error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {r.error}
        </p>
      )}
    </div>
  );
}
