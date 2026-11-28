"use client";

// Réagir à un bon plan en un geste (tâche 35), depuis la carte du fil ou la fenêtre de la carte.
import { useState } from "react";
import { announceReactions, fetchReactions, setReaction, type Reaction } from "./engagement";
import { dealEndReason, dealTrustLevel, doubtStatus, recentCounts } from "./rules";
import type { DealWithVotes } from "./types";
import { useCurrentUserId } from "./useCurrentUserId";

export function useDealReactions(deal: DealWithVotes) {
  const userId = useCurrentUserId();
  // Instant fixé à l'affichage (pas de Date.now() pendant le rendu).
  const [now] = useState(Date.now);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // La liste affichée (fil, carte, favoris) reçoit les réactions relues après chaque clic et les repasse ici.
  const votes = deal.votes ?? [];

  const myVote = userId ? votes.find((v) => v.user_id === userId)?.value : undefined;
  const reaction: Reaction = myVote === 1 ? "visited" : myVote === -1 ? "gone" : null;

  async function react(next: Exclude<Reaction, null>) {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      // « J'en ai profité » = vote +1 et passage ; le passage est retiré quand on décoche ou passe à « Plus dispo ».
      await setReaction(deal.id, userId, reaction === next ? null : next, {
        vote: myVote,
        visited: myVote === 1,
        visitsAvailable: true,
        placed: deal.lat !== null && deal.lng !== null,
      });
      announceReactions({ dealId: deal.id, ...(await fetchReactions(deal.id)) });
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return {
    now,
    votes,
    reaction,
    own: !!userId && userId === deal.author_id,
    /** `undefined` : la liste n'a pas chargé les votes (pas de badge). */
    trust: deal.votes ? dealTrustLevel(votes, now, deal.trust, !!doubtStatus(deal, votes)) : undefined,
    /** Terminée (retirée ou expirée) : plus de réactions. */
    ended: dealEndReason(deal, votes, now) !== null,
    counts: recentCounts(votes, now),
    busy: busy || !userId,
    error,
    react,
  };
}
