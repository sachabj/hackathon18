"use client";

// Boutons « J'y suis allé (n) » / « Plus dispo (n) » autonomes, pour la fenêtre d'un repère sur la carte.
import ReactionBar from "@/components/deal/ReactionBar";
import type { DealWithVotes } from "@/lib/types";
import { useDealReactions } from "@/lib/useDealReactions";

export default function QuickReactions({ deal }: { deal: DealWithVotes }) {
  const r = useDealReactions(deal);
  return (
    <div>
      <ReactionBar size="sm" counts={r.counts} reaction={r.reaction} busy={r.busy} own={r.own} onReact={r.react} />
      {r.error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {r.error}
        </p>
      )}
    </div>
  );
}
