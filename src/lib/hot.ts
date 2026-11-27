// Tri « Hot » des bons plans (tâche 32), façon Reddit / Hacker News. Voir memory/ARCHITECTURE.md § Hot.
// « J'en ai profité » = vote +1 et « Plus dispo » = vote -1 : tout se calcule avec les votes déjà chargés.
import type { Deal, Vote } from "./types";

const HOUR = 3600_000;

export const HOT = {
  /** Une réaction pèse moitié moins toutes les 24 h : les réactions récentes mesurent la vitesse. */
  halfLifeHours: 24,
  /** Poids d'un « Plus dispo » face à un « J'en ai profité ». */
  reportWeight: 1.5,
  /** Exposant de l'âge : plus il est grand, plus une offre ancienne descend vite. */
  gravity: 1.2,
};

/**
 * Hot = (1 + élan + quantité) / (âge en heures + 2)^gravité
 * - élan : réactions pondérées par leur fraîcheur (+1 par « J'en ai profité », -1,5 par « Plus dispo ») ;
 * - quantité : log2(1 + nombre total de « J'en ai profité ») ;
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
