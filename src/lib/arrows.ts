// « Les Flèches » côté navigateur : barème affiché, rangs, lecture et messages de gain.
// Les Flèches sont calculées par la base (supabase/migrations/016_arrows.sql) : garder le barème identique.
import { getSupabase } from "./supabase/client";
import type { Point } from "./geo";

export const ARROWS = { create: 50, bonus: 30, confirm: 10, report: 15 } as const;
export const DAILY_PAID_VOTES = 5;
export const STREAK_DAYS = 3;

export type ArrowKind = keyof typeof ARROWS;

export const KIND_LABELS: Record<ArrowKind, string> = {
  create: "Bon plan partagé",
  bonus: "Confirmé par 3 étudiants",
  confirm: "Confirmation",
  report: "Signalement d'expiration",
};

/** Rangs selon le solde, du plus bas au plus haut. */
export const RANKS = [
  { min: 0, label: "Éclaireur" },
  { min: 150, label: "Chasseur de bons plans" },
  { min: 500, label: "Robin des Étudiants" },
] as const;

/** Rang actuel, rang suivant et avancement (0..1) vers celui-ci. */
export function rankFor(total: number) {
  const index = RANKS.findLastIndex((r) => total >= r.min);
  const rank = RANKS[Math.max(0, index)];
  const next = RANKS[index + 1] ?? null;
  return {
    rank,
    next,
    missing: next ? next.min - total : 0,
    progress: next ? (total - rank.min) / (next.min - rank.min) : 1,
  };
}

export interface ArrowEvent {
  id: number;
  kind: ArrowKind;
  amount: number;
  multiplier: number;
  /** false : signalement en attente de deux autres étudiants */
  paid: boolean;
  created_at: string;
  /** null : offre supprimée depuis */
  title: string | null;
}

export interface MyArrows {
  total: number;
  pending: number;
  /** Jours consécutifs d'activité */
  streak: number;
  today_votes: number;
  history: ArrowEvent[];
}

/** Ses Flèches, ou null sans la migration 016 (rien n'est alors affiché). */
export async function fetchMyArrows(): Promise<MyArrows | null> {
  const { data, error } = await getSupabase().rpc("my_arrows");
  if (error) {
    if (error.code !== "PGRST202") console.warn("Flèches indisponibles :", error.message);
    return null;
  }
  return data as MyArrows;
}

/** Résultat d'un vote renvoyé par `react_to_deal`. */
export interface ArrowOutcome {
  status: "paid" | "pending" | "far" | "limit" | "already";
  kind: "confirm" | "report";
  amount: number;
  multiplier: number;
  /** 1 : près de l'offre (ou position inconnue) ; 0,5 : entre 500 m et 2 km */
  factor: number;
  archived: boolean;
}

export interface ArrowNotice {
  title: string;
  detail?: string;
}

export function outcomeNotice(o: ArrowOutcome): ArrowNotice | null {
  const notes = [
    o.factor === 0.5 && "à plus de 500 m : la moitié",
    o.multiplier > 1 && "série : gains × 1,5",
  ].filter(Boolean);
  const detail = (first: string) => [first, ...notes].join(" · ");
  switch (o.status) {
    case "paid":
      return {
        title: `+${o.amount} Flèches`,
        detail: detail(o.kind === "confirm" ? "Offre confirmée" : "Signalement corroboré, offre archivée"),
      };
    case "pending":
      return {
        title: "Signalement enregistré",
        detail: detail(`+${o.amount} Flèches quand 3 étudiants l'auront signalée`),
      };
    case "far":
      return { title: "Vote enregistré, sans Flèches", detail: "Tu es à plus de 2 km de l'offre." };
    case "limit":
      return {
        title: "Vote enregistré, sans Flèches",
        detail: `Tes ${DAILY_PAID_VOTES} votes récompensés du jour sont atteints.`,
      };
    default:
      return null;
  }
}

// ---------- Prévenir l'interface (solde affiché, message de gain) ----------
const EVENT = "sharewood:arrows";

/** Le solde a pu changer ; `notice` affiche en plus un message. */
export function announce(notice: ArrowNotice | null = null) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: notice }));
}

export function onArrows(listener: (notice: ArrowNotice | null) => void) {
  const handle = (e: Event) => listener((e as CustomEvent<ArrowNotice | null>).detail);
  window.addEventListener(EVENT, handle);
  return () => window.removeEventListener(EVENT, handle);
}

/** Après une publication : annonce les Flèches de création, si la base les a versées. */
export async function announceCreation() {
  const created = (await fetchMyArrows())?.history.find((e) => e.kind === "create");
  const recent = created && Date.now() - new Date(created.created_at).getTime() < 120_000;
  announce(
    recent
      ? {
          title: `+${created.amount} Flèches`,
          detail: `Bon plan partagé${created.multiplier > 1 ? " · série : gains × 1,5" : ""}`,
        }
      : null,
  );
}

/** Précision au-delà de laquelle la position ne dit rien (ordinateur localisé par son réseau). */
const MAX_ACCURACY_M = 1000;

/**
 * Position au moment d'un vote (le navigateur demande l'autorisation), pour le barème selon la distance.
 * null si elle est refusée, trop imprécise ou trop longue à obtenir : aucune pénalité. Elle n'est pas enregistrée.
 */
export function currentPosition(timeoutMs = 8000): Promise<Point | null> {
  if (!("geolocation" in navigator)) return Promise.resolve(null);
  return new Promise((resolve) => {
    // Une demande d'autorisation laissée sans réponse ne doit pas bloquer le vote.
    const timer = setTimeout(() => resolve(null), timeoutMs);
    const done = (point: Point | null) => {
      clearTimeout(timer);
      resolve(point);
    };
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        done(coords.accuracy <= MAX_ACCURACY_M ? { lat: coords.latitude, lng: coords.longitude } : null),
      () => done(null),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 6000 },
    );
  });
}
