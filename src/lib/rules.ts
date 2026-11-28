// Règles métier partagées (voir memory/ARCHITECTURE.md § Règles métier).
// Si vous changez une constante ou une formule ici, mettez à jour ARCHITECTURE.md.
import { BedIcon, CheckCircleIcon, FlameIcon, MoonIcon } from "@/components/icons";
import type { ComponentType } from "react";
import type { Deal, DealTrust, Vote } from "./types";

const HOUR = 3600_000;
const DAY = 24 * HOUR;

// ---------- Fiabilité façon Waze (tâche 33 ; voir supabase/migrations/014_voter_weights.sql) ----------
// Chaque réaction a une masse = poids de l'étudiant × fraîcheur ; un « Plus dispo » plus récent que la dernière
// confirmation compte davantage. Les poids sont calculés par la base (`deal_trust`) ; sans la migration 014,
// on retombe sur un poids de 1 pour tout le monde (`voteMasses`). Constantes à garder identiques en SQL.

/** Demi-vie d'une réaction : une réaction de 48 h compte deux fois moins qu'une réaction toute neuve. */
export const VOTE_HALF_LIFE_HOURS = 48;
/** « Le dernier mot compte » : un « Plus dispo » postérieur à la dernière confirmation pèse ×1,5. */
export const LATEST_REPORT_BOOST = 1.5;
/**
 * Confiance qui s'érode : score = (confirmations + a priori × poids) / (toutes les réactions + poids).
 * Sans réaction récente, le score redescend vers 0,5 (« À vérifier »).
 */
export const TRUST_PRIOR = 0.5;
export const TRUST_PRIOR_WEIGHT = 1;

/** Masses pondérées des réactions d'une offre ; poids de 1 pour tous (repli sans la migration 014). */
export function voteMasses(votes: Vote[], now: number): DealTrust {
  const lastOk = Math.max(-Infinity, ...votes.filter((v) => v.value === 1).map((v) => new Date(v.created_at).getTime()));
  let pos = 0;
  let neg = 0;
  for (const v of votes) {
    const t = new Date(v.created_at).getTime();
    const fresh = Math.pow(0.5, Math.max(0, now - t) / HOUR / VOTE_HALF_LIFE_HOURS);
    if (v.value === 1) pos += fresh;
    else neg += fresh * (t > lastOk ? LATEST_REPORT_BOOST : 1);
  }
  return { pos, neg };
}

/** Score 0..1 à partir des masses (a priori inclus). */
export const trustScore = ({ pos, neg }: DealTrust) =>
  (pos + TRUST_PRIOR * TRUST_PRIOR_WEIGHT) / (pos + neg + TRUST_PRIOR_WEIGHT);

/** `trust` : masses calculées par la base (poids des étudiants) ; sinon calcul local. */
export function reliability(votes: Vote[], now = Date.now(), trust?: DealTrust | null) {
  let lastConfirmedAt: number | null = null;
  for (const v of votes) {
    const t = new Date(v.created_at).getTime();
    if (v.value === 1 && (lastConfirmedAt === null || t > lastConfirmedAt)) lastConfirmedAt = t;
  }
  const masses = trust ?? voteMasses(votes, now);
  return {
    /** 0..1, ou null s'il n'y a aucune réaction */
    score: votes.length > 0 ? trustScore(masses) : null,
    masses,
    confirmations: votes.filter((v) => v.value === 1).length,
    reports: votes.filter((v) => v.value === -1).length,
    lastConfirmedAt,
  };
}

/** Compteurs affichés sur les boutons (tâche 35) : réactions des 30 derniers jours seulement. */
export const COUNT_WINDOW_DAYS = 30;
export function recentCounts(votes: Vote[], now: number) {
  const since = now - COUNT_WINDOW_DAYS * DAY;
  const recent = votes.filter((v) => new Date(v.created_at).getTime() >= since);
  return { visited: recent.filter((v) => v.value === 1).length, gone: recent.filter((v) => v.value === -1).length };
}

export type TrustLevel = "very_reliable" | "reliable" | "to_check" | "doubtful";

/**
 * Code couleur de la fiabilité (tâche 30), du meilleur au moins bon : `min` = score minimal (0..1).
 * Couleurs : pastille, fond et texte du badge (contraste lisible sur le fond crème).
 */
export const TRUST_LEVELS: Record<TrustLevel, { label: string; min: number; dot: string; bg: string; text: string }> = {
  very_reliable: { label: "Très fiable", min: 0.85, dot: "#1E3A2F", bg: "#CFE3CA", text: "#1E3A2F" },
  reliable: { label: "Fiable", min: 0.65, dot: "#5FA35A", bg: "#E5F2E1", text: "#2E5A2A" },
  to_check: { label: "À vérifier", min: 0.4, dot: "#D9A400", bg: "#FBF0CC", text: "#6E5200" },
  doubtful: { label: "Douteux", min: 0, dot: "#C0392B", bg: "#F8DDD9", text: "#8C2A20" },
};

/** Score 0..1 → niveau de couleur ; null sans vote (badge « Nouveau »). */
export function trustLevel(score: number | null): TrustLevel | null {
  if (score === null) return null;
  return (Object.keys(TRUST_LEVELS) as TrustLevel[]).find((l) => score >= TRUST_LEVELS[l].min) ?? "doubtful";
}

/** Niveau de fiabilité d'une offre affiché sur les cartes ; une offre « douteuse » l'est quel que soit son score. */
export function dealTrustLevel(votes: Vote[], now: number, trust?: DealTrust | null, doubtful = false) {
  return doubtful ? "doubtful" : trustLevel(reliability(votes, now, trust).score);
}

// ---------- Retrait des offres signalées (tâche 69 ; mêmes seuils dans la migration 023) ----------
/** Signalements « Plus dispo » qui font passer une offre en « Douteux ». */
export const DOUBT_REPORTS = 3;
/** Délai laissé à une offre douteuse. */
export const DOUBT_DAYS = 14;
/** « J'en ai profité » nécessaires, pendant ce délai, pour la sauver. */
export const RESCUE_CONFIRMATIONS = 3;
/** Autant de signalements en si peu de temps, sans confirmation entre-temps : retrait immédiat. */
export const BURST_REPORTS = 6;
export const BURST_HOURS = 48;

/** État d'une offre, tenu par la base. */
export type DealState = Pick<Deal, "doubtful_since" | "reports_reset_at" | "archived_at" | "author_id">;

const others = (deal: DealState, votes: Vote[], value: 1 | -1, after: number) =>
  votes.filter((v) => v.value === value && v.user_id !== deal.author_id && new Date(v.created_at).getTime() > after);

/** Signalements qui comptent : ceux faits depuis le dernier sauvetage de l'offre. */
export const activeReports = (deal: DealState, votes: Vote[]) =>
  others(deal, votes, -1, deal.reports_reset_at ? new Date(deal.reports_reset_at).getTime() : -Infinity).length;

/** Offre douteuse : date limite et confirmations déjà reçues ; null sinon. */
export function doubtStatus(deal: DealState, votes: Vote[]) {
  if (!deal.doubtful_since || deal.archived_at) return null;
  const since = new Date(deal.doubtful_since).getTime();
  const deadline = since + DOUBT_DAYS * DAY;
  const saved = others(deal, votes, 1, since).filter((v) => new Date(v.created_at).getTime() <= deadline).length;
  return { deadline, saved };
}

/** Masquée : retirée, terminée, expirée, ou douteuse et arrivée à échéance (avant que la base l'ait enregistré). */
export function isDealHidden(deal: Deal, votes: Vote[], now = Date.now()) {
  if (deal.ended_by_merchant || deal.archived_at) return true;
  if (deal.expires_at && new Date(deal.expires_at).getTime() < now) return true;
  const doubt = doubtStatus(deal, votes);
  return !!doubt && now >= doubt.deadline && doubt.saved < RESCUE_CONFIRMATIONS;
}

// ---------- Niveaux d'activité ----------
export type ActivityLevel = "tres_actif" | "actif" | "peu_actif" | "inactif";

export const LEVELS: Record<ActivityLevel, { label: string; Icon: ComponentType<{ className?: string }> }> = {
  tres_actif: { label: "Très actif", Icon: FlameIcon },
  actif: { label: "Actif", Icon: CheckCircleIcon },
  peu_actif: { label: "Peu actif", Icon: MoonIcon },
  inactif: { label: "Inactif", Icon: BedIcon },
};

/** Niveau selon le nombre de contributions sur 7 jours (seuils à ajuster). */
export function activityLevel(contributions7d: number): ActivityLevel {
  if (contributions7d >= 10) return "tres_actif";
  if (contributions7d >= 3) return "actif";
  if (contributions7d >= 1) return "peu_actif";
  return "inactif";
}

/** Prochain palier d'activité à atteindre, ou null au niveau maximal. */
export function nextLevel(contributions7d: number): { level: ActivityLevel; missing: number } | null {
  const steps: [ActivityLevel, number][] = [["peu_actif", 1], ["actif", 3], ["tres_actif", 10]];
  const next = steps.find(([, min]) => contributions7d < min);
  return next ? { level: next[0], missing: next[1] - contributions7d } : null;
}
