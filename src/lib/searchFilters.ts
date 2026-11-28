// Filtres et tri des résultats de la recherche (page /recherche).
import { TRANSPORT_MODES } from "./constants";
import { distanceKm, type Point } from "./geo";
import { travelMinutes } from "./matching";
import { tokenize } from "./search";
import type { Deal, DealRequirement, TransportMode } from "./types";
import { tr } from "./i18n";

/** `level` : niveau de prix maximal (colonne `deals.price_level`). */
export const PRICE_FILTERS = {
  any: { label: "Prix : tous", level: null },
  free: { label: "Gratuit", level: 0 },
  cheap: { label: "Moins de 10 €", level: 1 },
  medium: { label: "Jusqu'à 25 €", level: 2 },
} as const;

export const SORTS = {
  relevance: "Tri : pertinence",
  distance: "Les plus proches",
  price: "Les moins chers",
} as const;

export const FILTER_MODES = ["walk", "bike", "bus", "car"] as const satisfies readonly TransportMode[];
export const DURATIONS = [10, 20, 30] as const;

export interface SearchFilters {
  price: keyof typeof PRICE_FILTERS;
  sort: keyof typeof SORTS;
  mode: (typeof FILTER_MODES)[number];
  /** Temps de trajet maximal, ou null : peu importe. */
  maxMinutes: (typeof DURATIONS)[number] | null;
  /** "none" : offres sans condition. */
  requirement: "any" | "none" | DealRequirement;
}

/** Moyen présélectionné : le plus rapide de ceux du profil. */
export function defaultMode(modes: TransportMode[]): SearchFilters["mode"] {
  if (modes.includes("car") || modes.includes("carpool")) return "car";
  if (modes.includes("bus") || modes.includes("train")) return "bus";
  return modes.includes("bike") ? "bike" : "walk";
}

export const defaultFilters = (modes: TransportMode[]): SearchFilters => ({
  price: "any",
  sort: "relevance",
  mode: defaultMode(modes),
  maxMinutes: null,
  requirement: "any",
});

/** Expressions de la saisie qui activent un filtre au lieu d'être cherchées (écrites sans accents). */
const INTENTS: { phrases: string[]; filters: Partial<SearchFilters> }[] = [
  // « gratuit » après « pas cher » : s'il y a les deux, il l'emporte.
  {
    phrases: ["pas trop cher", "pas trop chere", "pas cher", "pas chere", "pas chers", "petit prix", "petits prix"],
    filters: { price: "cheap" },
  },
  { phrases: ["gratuit", "gratuite", "gratuits", "gratuites"], filters: { price: "free" } },
  {
    phrases: ["pres de chez moi", "pres de moi", "autour de moi", "proche de moi", "a cote de moi", "a proximite"],
    filters: { sort: "distance" },
  },
];

/** Sépare la saisie en mots à chercher (`text`) et en filtres demandés (`filters`). */
export function readIntents(query: string) {
  let words = tokenize(query);
  let filters: Partial<SearchFilters> = {};
  for (const intent of INTENTS) {
    for (const phrase of intent.phrases.map(tokenize)) {
      for (let i = 0; i + phrase.length <= words.length; i++) {
        if (phrase.every((w, k) => words[i + k] === w)) {
          words = [...words.slice(0, i), ...words.slice(i + phrase.length)];
          filters = { ...filters, ...intent.filters };
          i--;
        }
      }
    }
  }
  return { text: words.join(" "), filters };
}

/** Distance depuis l'étudiant ; null pour une offre sans lieu précis ou sans point de départ. */
export const dealDistance = (deal: Deal, origin: Point | null) =>
  origin && deal.scope === "local" && deal.lat !== null && deal.lng !== null
    ? distanceKm(origin, { lat: deal.lat, lng: deal.lng })
    : null;

/** « ≈ 12 min à pied », affiché sur la carte à la place de la distance habituelle. */
export const travelLabel = (km: number, mode: TransportMode) =>
  tr("≈ {n} min {by}", { n: travelMinutes(km, mode), by: tr(TRANSPORT_MODES[mode].by) });

/**
 * Garde les offres qui passent les filtres puis les trie ; la pertinence garde l'ordre reçu.
 * Un filtre actif écarte les offres dont on ignore l'information (prix non indiqué, pas de lieu).
 */
export function applyFilters<T extends { deal: Deal }>(items: T[], filters: SearchFilters, origin: Point | null) {
  const maxLevel = PRICE_FILTERS[filters.price].level;
  const kept = items.filter(({ deal }) => {
    if (maxLevel !== null && (deal.price_level == null || deal.price_level > maxLevel)) return false;
    const requirements = deal.requirements ?? [];
    if (filters.requirement === "none" && requirements.length > 0) return false;
    if (filters.requirement !== "any" && filters.requirement !== "none" && !requirements.includes(filters.requirement)) {
      return false;
    }
    if (filters.maxMinutes !== null && origin) {
      const km = dealDistance(deal, origin);
      if (km === null || travelMinutes(km, filters.mode) > filters.maxMinutes) return false;
    }
    return true;
  });
  if (filters.sort === "relevance") return kept;
  // Information inconnue : en fin de liste.
  const value = ({ deal }: T) =>
    (filters.sort === "distance" ? dealDistance(deal, origin) : deal.price_level) ?? Number.MAX_SAFE_INTEGER;
  return [...kept].sort((a, b) => value(a) - value(b));
}
