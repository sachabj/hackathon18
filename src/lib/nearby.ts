// Notification « sur place » (tâches 11 et 68) : « Tu es près de… : toujours dispo ? ».
// Simulée depuis le profil (démo), ou automatique quand « Bons plans à proximité » est activé (appli ouverte, position
// partagée). La réaction part toujours avec la vraie position (Flèches et « Plus dispo » seulement à 500 m).
import type { Deal } from "./types";

const EVENT = "sharewood:nearby";
export type NearbyNotice = { deal: Deal; simulated: boolean };

/** Démonstration : l'offre devant laquelle on dit se trouver. */
export function simulateVisit(deal: Deal) {
  window.dispatchEvent(new CustomEvent<NearbyNotice>(EVENT, { detail: { deal, simulated: true } }));
}

/** Vraie proximité, détectée dans le navigateur. */
export function notifyNearby(deal: Deal) {
  window.dispatchEvent(new CustomEvent<NearbyNotice>(EVENT, { detail: { deal, simulated: false } }));
}

export function onNearby(listener: (notice: NearbyNotice) => void) {
  const handle = (e: Event) => listener((e as CustomEvent<NearbyNotice>).detail);
  window.addEventListener(EVENT, handle);
  return () => window.removeEventListener(EVENT, handle);
}
