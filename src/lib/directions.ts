// Itinéraire vers un bon plan : Apple Plans sur les appareils Apple, Google Maps ailleurs.
// Un simple lien : rien n'est envoyé tant que l'étudiant ne le touche pas.
import type { Point } from "./geo";

export function directionsUrl({ lat, lng }: Point, userAgent: string) {
  const destination = `${lat},${lng}`;
  return /iPhone|iPad|iPod|Macintosh/.test(userAgent)
    ? `https://maps.apple.com/?daddr=${destination}`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}
