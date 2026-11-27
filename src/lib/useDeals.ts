"use client";

import { useEffect, useState } from "react";
import { ZONES } from "./constants";
import { isDealHidden } from "./rules";
import { getSupabase, isSupabaseConfigured } from "./supabase/client";
import type { DealWithVotes, Vote } from "./types";

/** Bons plans visibles (RLS + règles de masquage), du plus récent au plus ancien. */
export function useDeals() {
  const [deals, setDeals] = useState<DealWithVotes[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

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
        const rows = dealsResult.data as (DealWithVotes & { votes: Vote[] })[];
        setDeals(
          rows.filter((d) => !isDealHidden(d, d.votes, activeUsers.get(d.zone_id ?? "") ?? 0)),
        );
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { deals, loading, error };
}
