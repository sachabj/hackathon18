// Masses pondérées des réactions (poids des étudiants calculés par la base, migration 014).
import { getSupabase } from "./supabase/client";
import type { DealTrust, DealWithVotes } from "./types";

/** Masses par bon plan, ou null si la fonction n'existe pas encore (migration 014 pas lancée) : calcul local. */
export async function fetchDealTrust(ids: string[]): Promise<Map<string, DealTrust> | null> {
  if (ids.length === 0) return new Map();
  const { data, error } = await getSupabase().rpc("deal_trust", { p_ids: ids });
  if (error) {
    console.warn("Fiabilité pondérée indisponible (migration 014 ?) :", error.message);
    return null;
  }
  return new Map(
    (data as { deal_id: string; pos: number; neg: number }[]).map((r) => [r.deal_id, { pos: Number(r.pos), neg: Number(r.neg) }]),
  );
}

/** Ajoute `trust` à chaque bon plan (sans réaction : masses nulles). Inchangé si la base ne répond pas. */
export async function withTrust<T extends DealWithVotes>(deals: T[]): Promise<T[]> {
  const map = await fetchDealTrust(deals.map((d) => d.id));
  if (!map) return deals;
  return deals.map((d) => ({ ...d, trust: map.get(d.id) ?? { pos: 0, neg: 0 } }));
}
