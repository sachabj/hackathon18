// Tri « Hot » des bons plans (tâche 31), façon Reddit / Hacker News. Voir memory/ARCHITECTURE.md § Hot.
// « J'y suis allé » = vote +1 et « Plus dispo » = vote -1 : tout se calcule avec les votes déjà chargés.
import type { Deal, Vote } from "./types";

const HOUR = 3600_000;

export const HOT = {
  /** Une réaction pèse moitié moins toutes les 24 h : les réactions récentes mesurent la vitesse. */
  halfLifeHours: 24,
  /** Poids d'un « Plus dispo » face à un « J'y suis allé ». */
  reportWeight: 1.5,
  /** Exposant de l'âge : plus il est grand, plus une offre ancienne descend vite. */
  gravity: 1.2,
  /** Badge « Tendance » : au moins N « J'y suis allé » sur la fenêtre. */
  trendingMin: 3,
  trendingWindowHours: 24,
};

/**
 * Hot = (1 + élan + quantité) / (âge en heures + 2)^gravité
 * - élan : réactions pondérées par leur fraîcheur (+1 par « J'y suis allé », -1,5 par « Plus dispo ») ;
 * - quantité : log2(1 + nombre total de « J'y suis allé ») ;
 * - âge : depuis la publication. Une offre neuve démarre haut puis descend si personne n'y va.
 */
export function hotScore(deal: Pick<Deal, "created_at">, votes: Vote[], now: number) {
  let momentum = 0;
  let confirmations = 0;
  for (const v of votes) {
    const ageHours = Math.max(0, (now - new Date(v.created_at).getTime()) / HOUR);
    const weight = Math.pow(0.5, ageHours / HOT.halfLifeHours);
    if (v.value === 1) {
      momentum += weight;
      confirmations += 1;
    } else {
      momentum -= HOT.reportWeight * weight;
    }
  }
  const quantity = Math.log2(1 + confirmations);
  const ageHours = Math.max(0, (now - new Date(deal.created_at).getTime()) / HOUR);
  return (1 + momentum + quantity) / Math.pow(ageHours + 2, HOT.gravity);
}

/** Au moins `trendingMin` « J'y suis allé » dans les dernières `trendingWindowHours` heures. */
export function isTrending(votes: Vote[] | undefined, now: number) {
  if (!votes) return false;
  const since = now - HOT.trendingWindowHours * HOUR;
  return votes.filter((v) => v.value === 1 && new Date(v.created_at).getTime() >= since).length >= HOT.trendingMin;
}
