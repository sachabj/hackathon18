// Recherche d'un commerce par nom + ville via Photon (géocodeur OpenStreetMap, gratuit, sans clé).
// Responsable : Matteo (tâche 6).
import { MAP_CENTER } from "./constants";
import type { ActivityId, DealCategory } from "./types";

export interface Place {
  /** Identifiant OSM, unique */
  id: string;
  name: string;
  /** « 2 Place du Vert Buisson, 35170 Bruz » */
  address: string;
  city: string | null;
  lat: number;
  lng: number;
  /** Type OSM (supermarket, fast_food, cinema…) */
  kind: string;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_type: string;
    osm_id: number;
    osm_value?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    postcode?: string;
    city?: string;
  };
}

/** Commerces correspondant au nom et à la ville (résultats proches de `near`, Bruz par défaut, en premier). */
export async function searchPlaces(
  store: string,
  city: string,
  signal?: AbortSignal,
  near: { lat: number; lng: number } = { lat: MAP_CENTER[0], lng: MAP_CENTER[1] },
): Promise<Place[]> {
  const params = new URLSearchParams({
    q: `${store} ${city}`.trim(),
    lang: "fr",
    limit: "8",
    lat: String(near.lat),
    lon: String(near.lng),
  });
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, { signal });
  if (!res.ok) throw new Error("Recherche du lieu indisponible pour le moment.");
  const { features } = (await res.json()) as { features: PhotonFeature[] };

  const seen = new Set<string>();
  const places: Place[] = [];
  for (const { geometry, properties: p } of features) {
    const id = `${p.osm_type}${p.osm_id}`;
    if (!p.name || seen.has(id)) continue;
    seen.add(id);
    const street = [p.housenumber, p.street].filter(Boolean).join(" ");
    const town = [p.postcode, p.city].filter(Boolean).join(" ");
    places.push({
      id,
      name: p.name,
      address: [street, town].filter(Boolean).join(", "),
      city: p.city ?? null,
      lat: geometry.coordinates[1],
      lng: geometry.coordinates[0],
      kind: p.osm_value ?? "",
    });
  }
  return places.slice(0, 6);
}

/** Libellé lisible du type de lieu, pour départager deux résultats du même nom. */
const KIND_LABELS: Record<string, string> = {
  supermarket: "Supermarché",
  convenience: "Supérette",
  bakery: "Boulangerie",
  fuel: "Station-service",
  gas: "Station-service",
  fast_food: "Restauration rapide",
  restaurant: "Restaurant",
  cafe: "Café",
  bar: "Bar",
  pub: "Pub",
  cinema: "Cinéma",
  theatre: "Théâtre",
  swimming_pool: "Piscine",
  sports_centre: "Centre sportif",
  fitness_centre: "Salle de sport",
  station: "Gare",
  bus_station: "Gare routière",
  university: "Université",
};
export const kindLabel = (kind: string) => KIND_LABELS[kind] ?? null;

/** Catégorie proposée d'après le type de lieu OSM (l'utilisateur peut la changer). */
export function suggestCategory(kind: string): DealCategory | null {
  if (["supermarket", "convenience", "department_store", "mall", "greengrocer", "bakery"].includes(kind))
    return "supermarket";
  if (["fast_food", "restaurant", "cafe", "bar", "pub", "food_court", "ice_cream"].includes(kind))
    return "restaurant";
  if (["cinema", "theatre", "swimming_pool", "sports_centre", "fitness_centre", "bowling_alley", "museum", "escape_game", "nightclub"].includes(kind))
    return "activity";
  if (["station", "bus_station", "car_rental", "bicycle_rental"].includes(kind)) return "transport";
  return null;
}

/** Activité proposée d'après le type de lieu OSM. */
export function suggestActivity(kind: string): ActivityId | null {
  const map: Record<string, ActivityId> = {
    cinema: "cinema",
    theatre: "culture",
    museum: "culture",
    swimming_pool: "swimming",
    fitness_centre: "fitness",
    sports_centre: "team_sport",
    nightclub: "nightlife",
    bar: "nightlife",
    pub: "nightlife",
    bowling_alley: "games",
    escape_game: "games",
  };
  return map[kind] ?? null;
}
