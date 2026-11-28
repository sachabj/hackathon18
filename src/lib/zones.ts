// Villes (zones) : les trois de la démo plus toutes celles choisies par les étudiants (migration 027).
// Responsable : Sacha (tâche 52).
import { useEffect, useSyncExternalStore } from "react";
import { ZONES } from "./constants";
import { distanceKm, type Point } from "./geo";
import { getSupabase, isSupabaseConfigured } from "./supabase/client";

export interface Zone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
}

const known = new Map<string, Zone>(ZONES.map((z) => [z.id, { ...z }]));
let version = 0;
const listeners = new Set<() => void>();

function add(zones: Zone[]) {
  for (const z of zones) known.set(z.id, z);
  version++;
  listeners.forEach((l) => l());
}

type Row = { id: string; name: string; center_lat: number; center_lng: number; radius_m: number };
const fromRow = (r: Row): Zone => ({ id: r.id, name: r.name, lat: r.center_lat, lng: r.center_lng, radiusM: r.radius_m });

export const zoneById = (id: string | null | undefined) => (id ? known.get(id) : undefined);
export const allZones = () => [...known.values()];

/** Zone la plus proche d'un point, parmi toutes les villes connues. */
export function nearestZone(point: Point) {
  return allZones()
    .map((zone) => ({ zone, km: distanceKm(point, zone) }))
    .sort((a, b) => a.km - b.km)[0];
}

/** Zone qui contient ce point (son rayon + 5 km), ou null. */
export function zoneAround(point: Point) {
  const near = nearestZone(point);
  return near && near.km <= near.zone.radiusM / 1000 + 5 ? near.zone : null;
}

let loading: Promise<void> | null = null;

/** Charge les villes enregistrées en base (une fois) ; à attendre avant d'afficher noms et distances. */
export function loadZones() {
  if (!isSupabaseConfigured) return Promise.resolve();
  loading ??= Promise.resolve(getSupabase().from("zones").select("id, name, center_lat, center_lng, radius_m"))
    .then(({ data, error }) => {
      if (error) throw error;
      add((data as Row[]).map(fromRow));
    })
    .catch((e) => {
      loading = null; // on réessaiera
      console.warn("Villes non chargées :", (e as Error).message);
    });
  return loading;
}

/** Fait réafficher le composant quand de nouvelles villes sont connues. */
export function useZones() {
  useEffect(() => {
    loadZones();
  }, []);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
    () => 0,
  );
}

/** Une ville de France trouvée par la recherche ou « Me localiser ». */
export interface City {
  name: string;
  /** Numéro de département (« 35 ») ou nom du département, pour départager les homonymes */
  department: string;
  /** Département en clair, affiché dans les résultats */
  county: string;
  lat: number;
  lng: number;
  radiusM: number;
}

/** Grandes villes étudiantes, en raccourci (les zones de la démo sont proposées à part). */
export const STUDENT_CITIES: City[] = [
  { name: "Paris", department: "75", county: "Paris", lat: 48.8566, lng: 2.3522, radiusM: 9000 },
  { name: "Lyon", department: "69", county: "Rhône", lat: 45.764, lng: 4.8357, radiusM: 6000 },
  { name: "Toulouse", department: "31", county: "Haute-Garonne", lat: 43.6047, lng: 1.4442, radiusM: 7000 },
  { name: "Marseille", department: "13", county: "Bouches-du-Rhône", lat: 43.2965, lng: 5.3698, radiusM: 9000 },
  { name: "Lille", department: "59", county: "Nord", lat: 50.6292, lng: 3.0573, radiusM: 5000 },
  { name: "Bordeaux", department: "33", county: "Gironde", lat: 44.8378, lng: -0.5792, radiusM: 6000 },
  { name: "Nantes", department: "44", county: "Loire-Atlantique", lat: 47.2184, lng: -1.5536, radiusM: 6000 },
  { name: "Montpellier", department: "34", county: "Hérault", lat: 43.6108, lng: 3.8767, radiusM: 5000 },
  { name: "Strasbourg", department: "67", county: "Bas-Rhin", lat: 48.5734, lng: 7.7521, radiusM: 5000 },
  { name: "Grenoble", department: "38", county: "Isère", lat: 45.1885, lng: 5.7245, radiusM: 4000 },
];

interface PhotonCity {
  geometry: { coordinates: [number, number] };
  properties: { name?: string; city?: string; postcode?: string; county?: string; countrycode?: string; extent?: [number, number, number, number] };
}

function toCity({ geometry, properties: p }: PhotonCity): City | null {
  const name = p.name ?? p.city;
  if (!name || p.countrycode !== "FR") return null;
  const [lng, lat] = geometry.coordinates;
  // Rayon d'après l'emprise de la commune (entre 1,5 et 15 km), 5 km sinon.
  const radiusM = p.extent
    ? Math.round(Math.max(distanceKm({ lat, lng }, { lat: p.extent[1], lng: p.extent[0] }), distanceKm({ lat, lng }, { lat: p.extent[3], lng: p.extent[2] })) * 1000)
    : 5000;
  const department = p.postcode ? p.postcode.slice(0, p.postcode.startsWith("97") ? 3 : 2) : (p.county ?? "");
  return { name, department, county: p.county ?? "", lat, lng, radiusM: Math.min(15000, Math.max(1500, radiusM)) };
}

/** Communes de France dont le nom correspond (Photon, OpenStreetMap). Seul le texte tapé est envoyé. */
export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const params = new URLSearchParams({ q: query.trim(), lang: "fr", limit: "10", layer: "city" });
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, { signal });
  if (!res.ok) throw new Error("Recherche de ville indisponible pour le moment.");
  const { features } = (await res.json()) as { features: PhotonCity[] };
  const cities = new Map<string, City>();
  for (const city of features.map(toCity)) {
    if (city && !cities.has(`${city.name}|${city.department}`)) cities.set(`${city.name}|${city.department}`, city);
  }
  return [...cities.values()].slice(0, 6);
}

/**
 * Commune où se trouve une position (« Me localiser »). La position est arrondie à ~1 km avant d'être
 * envoyée à Photon ; null si rien n'est trouvé en France.
 */
export async function cityAt(point: Point): Promise<City | null> {
  const round = (v: number) => Math.round(v * 100) / 100;
  const params = new URLSearchParams({ lat: String(round(point.lat)), lon: String(round(point.lng)), lang: "fr", layer: "city" });
  const res = await fetch(`https://photon.komoot.io/reverse?${params}`);
  if (!res.ok) return null;
  const { features } = (await res.json()) as { features: PhotonCity[] };
  return features.map(toCity).find(Boolean) ?? null;
}

/** La ville choisie devient une zone (existante si déjà connue). */
export async function ensureZone(city: City): Promise<Zone> {
  const same = allZones().find(
    (z) => z.name.toLowerCase() === city.name.toLowerCase() && distanceKm(z, city) < 10,
  );
  if (same) return same;
  const { data, error } = await getSupabase().rpc("ensure_zone", {
    p_name: city.name,
    p_department: city.department,
    p_lat: city.lat,
    p_lng: city.lng,
    p_radius_m: city.radiusM,
  });
  if (error) {
    throw new Error(
      error.code === "PGRST202"
        ? "La base de données n'est pas à jour : lancer supabase/migrations/027_any_city.sql."
        : error.message,
    );
  }
  const zone = fromRow(data as Row);
  add([zone]);
  return zone;
}

// ---------- Carte Sortir (tâche 54) ----------
/** La Carte Sortir est un dispositif de Rennes Métropole : la question et l'avantage ne concernent que les environs. */
const RENNES = { lat: 48.1113, lng: -1.68 };
export const CARTE_SORTIR_RADIUS_KM = 20;

export function carteSortirArea(me: { homeZoneId: string | null; position: Point | null }) {
  const origin = me.position ?? zoneById(me.homeZoneId);
  return !!origin && distanceKm(origin, RENNES) <= CARTE_SORTIR_RADIUS_KM;
}
