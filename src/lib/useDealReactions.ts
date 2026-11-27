"use client";

// Réagir à un bon plan en un geste (tâche 35), depuis la carte du fil ou la fenêtre de la carte.
import { useState } from "react";
import { fetchReactions, setReaction, type Reaction, type Reactions } from "./engagement";
import { dealTrustLevel, recentCounts } from "./rules";
import type { DealWithVotes } from "./types";
import { useCurrentUserId } from "./useCurrentUserId";

export function useDealReactions(deal: DealWithVotes) {
  const userId = useCurrentUserId();
  // Instant fixé à l'affichage (pas de Date.now() pendant le rendu).
  const [now] = useState(Date.now);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Réactions relues après un clic ; oubliées dès que la liste est rechargée (nouvel objet `deal.votes`).
  const [local, setLocal] = useState<(Reactions & { base: DealWithVotes["votes"] }) | null>(null);
  const live = local && local.base === deal.votes ? local : null;
  const votes = live?.votes ?? deal.votes ?? [];
  const masses = live ? live.trust : deal.trust;

  const myVote = userId ? votes.find((v) => v.user_id === userId)?.value : undefined;
  const reaction: Reaction = myVote === 1 ? "visited" : myVote === -1 ? "gone" : null;
  const remember = (r: Reactions) => setLocal({ ...r, base: deal.votes });

  async function react(next: Exclude<Reaction, null>) {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      // « J'y suis allé » = vote +1 et passage ; le passage est retiré quand on décoche ou passe à « Plus dispo ».
      await setReaction(deal.id, userId, reaction === next ? null : next, {
        vote: myVote,
        visited: myVote === 1,
        visitsAvailable: true,
        placed: deal.lat !== null && deal.lng !== null,
      });
      remember(await fetchReactions(deal.id));
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
    trust: deal.votes ? dealTrustLevel(votes, now, masses) : undefined,
    counts: recentCounts(votes, now),
    busy: busy || !userId,
    error,
    react,
    /** À appeler après une réaction dans la fiche. */
    remember,
  };
}
