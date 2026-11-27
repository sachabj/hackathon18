// Calculs des statistiques commerçant, à partir des votes et favoris des étudiants.
import type { Deal, OfferStats } from "./types";

export type Metric = "favorites" | "confirmations" | "reports";

export const METRICS: Record<Metric, { label: string; emoji: string }> = {
  favorites: { label: "Favoris", emoji: "❤️" },
  confirmations: { label: "Confirmations", emoji: "👍" },
  reports: { label: "Signalements", emoji: "👎" },
};

export const isOnline = (offer: Deal, now: number) =>
  !offer.ended_by_merchant && (!offer.expires_at || new Date(offer.expires_at).getTime() >= now);

export function summarize(offers: Deal[], stats: Record<string, OfferStats>, now: number) {
  const rows = offers.map((offer) => ({
    offer,
    online: isOnline(offer, now),
    favorites: stats[offer.id]?.favorites ?? 0,
    confirmations: stats[offer.id]?.confirmations ?? 0,
    reports: stats[offer.id]?.reports ?? 0,
  }));
  const total = (m: Metric) => rows.reduce((sum, r) => sum + r[m], 0);
  const totals = {
    favorites: total("favorites"),
    confirmations: total("confirmations"),
    reports: total("reports"),
  };
  const votes = totals.confirmations + totals.reports;
  return {
    rows,
    totals,
    online: rows.filter((r) => r.online).length,
    /** Part des votes « toujours dispo », ou null sans aucun vote. */
    trust: votes > 0 ? Math.round((totals.confirmations / votes) * 100) : null,
  };
}
