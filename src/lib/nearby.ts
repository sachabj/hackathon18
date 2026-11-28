// Notification « sur place » simulée (tâche 11) : le web ne peut pas suivre la position en arrière-plan,
// la démonstration choisit l'offre devant laquelle on se trouve. Seule la notification est simulée :
// la réaction part avec la vraie position (Flèches et « Plus dispo » seulement à moins de 500 m, règles 020 et 021).
import type { Deal } from "./types";

const EVENT = "sharewood:nearby";

/** Offre « à côté de laquelle on passe » : affiche la notification. */
export function simulateVisit(deal: Deal) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: deal }));
}

export function onNearby(listener: (deal: Deal) => void) {
  const handle = (e: Event) => listener((e as CustomEvent<Deal>).detail);
  window.addEventListener(EVENT, handle);
  return () => window.removeEventListener(EVENT, handle);
}
