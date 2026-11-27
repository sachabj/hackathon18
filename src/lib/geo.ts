import { ZONES } from "./constants";

export interface Point {
  lat: number;
  lng: number;
}

/** Distance à vol d'oiseau en kilomètres (haversine). */
export function distanceKm(a: Point, b: Point) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

export function nearestZone(point: Point) {
  return ZONES.map((zone) => ({ zone, km: distanceKm(point, zone) })).sort((a, b) => a.km - b.km)[0];
}

export const formatDistance = (km: number) =>
  km < 1 ? `${Math.max(50, Math.round(km * 20) * 50)} m` : `${km.toFixed(1).replace(".", ",")} km`;
