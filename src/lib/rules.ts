// Règles métier partagées (voir memory/ARCHITECTURE.md § Règles métier).
// Si vous changez une constante ou une formule ici, mettez à jour ARCHITECTURE.md.
import { BedIcon, CheckCircleIcon, FlameIcon, MoonIcon } from "@/components/icons";
import type { ComponentType } from "react";
import type { Deal, Profile, Vote } from "./types";

const HOUR = 3600_000;
const DAY = 24 * HOUR;

// ---------- Fiabilité (Anne-Lise) ----------
/** Demi-vie d'un vote : un vote de 48 h compte deux fois moins qu'un vote tout neuf. */
export const VOTE_HALF_LIFE_HOURS = 48;
/** En dessous de ce score, le bon plan est masqué (si assez de votes). */
export const HIDE_BELOW_SCORE = 0.3;

export function reliability(votes: Vote[], now = Date.now()) {
  let pos = 0;
  let total = 0;
  let lastConfirmedAt: number | null = null;
  for (const v of votes) {
    const t = new Date(v.created_at).getTime();
    const w = Math.pow(0.5, (now - t) / HOUR / VOTE_HALF_LIFE_HOURS);
    total += w;
    if (v.value === 1) {
      pos += w;
      if (lastConfirmedAt === null || t > lastConfirmedAt) lastConfirmedAt = t;
    }
  }
  return {
    /** 0..1, ou null s'il n'y a aucun vote */
    score: total > 0 ? pos / total : null,
    confirmations: votes.filter((v) => v.value === 1).length,
    reports: votes.filter((v) => v.value === -1).length,
    lastConfirmedAt,
  };
}

/** Nombre de votes minimum avant de pouvoir masquer un bon plan : s'adapte au nb d'utilisateurs actifs de la zone. */
export function minVotesToHide(activeUsersInZone: number) {
  return Math.min(10, Math.max(2, Math.ceil(activeUsersInZone * 0.05)));
}

export function isDealHidden(deal: Deal, votes: Vote[], activeUsersInZone: number, now = Date.now()) {
  if (deal.ended_by_merchant) return true;
  if (deal.expires_at && new Date(deal.expires_at).getTime() < now) return true;
  const { score } = reliability(votes, now);
  return votes.length >= minVotesToHide(activeUsersInZone) && score !== null && score < HIDE_BELOW_SCORE;
}

// ---------- Récompenses (Matteo) ----------
export const FULL_ACCESS_DAYS = 7;
/** Retard d'affichage des nouveaux bons plans pour un utilisateur inactif (appliqué aussi en RLS). */
export const INACTIVE_DELAY_HOURS = 24;

export function fullAccess(profile: Pick<Profile, "last_contribution_at">, now = Date.now()) {
  if (!profile.last_contribution_at) return { active: false, daysLeft: 0 };
  const until = new Date(profile.last_contribution_at).getTime() + FULL_ACCESS_DAYS * DAY;
  const msLeft = until - now;
  return { active: msLeft > 0, daysLeft: Math.max(0, Math.ceil(msLeft / DAY)) };
}

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
