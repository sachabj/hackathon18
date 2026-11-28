"use client";

import { useEffect, useState } from "react";
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
  /** Instant du chargement : référence du tri Hot (évite Date.now() pendant l'affichage). */
  const [loadedAt, setLoadedAt] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    async function load() {
      const supabase = getSupabase();
      // Retire les offres douteuses arrivées à échéance (migration 023) ; sans attendre : `isDealHidden` les masque déjà.
      supabase.rpc("settle_doubtful_deals").then(({ error }) => {
        if (error && error.code !== "PGRST202") console.warn("Offres douteuses non traitées :", error.message);
      });
      const dealsResult = await supabase.from("deals").select("*, votes(*)").order("created_at", { ascending: false });
      if (cancelled) return;

      if (dealsResult.error) {
        setError(dealsResult.error.message);
      } else {
        // Fiabilité pondérée par le poids des étudiants (migration 014) ; sans elle, calcul local à poids égal.
        const rows = await withTrust(dealsResult.data as (DealWithVotes & { votes: Vote[] })[]);
        if (cancelled) return;
        const now = Date.now();
        setDeals(
          rows
            .filter((d) => !isDealHidden(d, d.votes, now))
            .map(normalizeDeal),
        );
      }
      setLoadedAt(Date.now());
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { deals, loading, error, loadedAt };
}
