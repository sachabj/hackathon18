"use client";

import { useEffect, useState } from "react";
import { applyReactions, onReactions, settleDoubtfulDeals } from "./engagement";
import { hotScore } from "./hot";
import { normalizeDeal } from "./legacy";
import { isDealHidden } from "./rules";
import { getSupabase, isSupabaseConfigured } from "./supabase/client";
import { withTrust } from "./trust";
import type { DealWithVotes, Vote } from "./types";

/** Bons plans visibles (RLS + règles de masquage), du plus récent au plus ancien. */
export function useDeals() {
  const [deals, setDeals] = useState<DealWithVotes[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  /** Scores Hot figés au chargement : une réaction met à jour les chiffres sans déplacer les cartes. */
  const [hot, setHot] = useState<Map<string, number>>(new Map());

  // Réaction faite sur cette page (fil, carte ou fiche) : la liste la reprend aussitôt.
  useEffect(() => onReactions((change) => setDeals((list) => applyReactions(list, change))), []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    async function load() {
      const supabase = getSupabase();
      // Sans attendre : `isDealHidden` masque déjà les offres douteuses arrivées à échéance.
      settleDoubtfulDeals();
      const dealsResult = await supabase.from("deals").select("*, votes(*)").order("created_at", { ascending: false });
      if (cancelled) return;

      if (dealsResult.error) {
        setError(dealsResult.error.message);
      } else {
        // Fiabilité pondérée par le poids des étudiants (migration 014) ; sans elle, calcul local à poids égal.
        const rows = await withTrust(dealsResult.data as (DealWithVotes & { votes: Vote[] })[]);
        if (cancelled) return;
        const now = Date.now();
        const visible = rows.filter((d) => !isDealHidden(d, d.votes, now)).map(normalizeDeal);
        setDeals(visible);
        setHot(new Map(visible.map((d) => [d.id, hotScore(d, d.votes, now)])));
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { deals, loading, error, hot };
}
