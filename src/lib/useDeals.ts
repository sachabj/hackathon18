"use client";

import { useEffect, useState } from "react";
import { ZONES } from "./constants";
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
      const [dealsResult, ...zoneResults] = await Promise.all([
        supabase.from("deals").select("*, votes(*)").order("created_at", { ascending: false }),
        ...ZONES.map((z) => supabase.rpc("active_users_in_zone", { z: z.id })),
      ]);
      if (cancelled) return;

      if (dealsResult.error) {
        setError(dealsResult.error.message);
      } else {
        // Sans zone (ou si le comptage échoue) : 0, soit le seuil de votes minimal.
        const activeUsers = new Map<string, number>(
          ZONES.map((z, i) => [z.id, Number(zoneResults[i].data ?? 0)]),
        );
        // Fiabilité pondérée par le poids des étudiants (migration 014) ; sans elle, calcul local à poids égal.
        const rows = await withTrust(dealsResult.data as (DealWithVotes & { votes: Vote[] })[]);
        if (cancelled) return;
        const now = Date.now();
        setDeals(
          rows
            .filter((d) => !isDealHidden(d, d.votes, activeUsers.get(d.zone_id ?? "") ?? 0, now, d.trust))
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
