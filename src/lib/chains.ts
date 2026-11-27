// Grandes enseignes : reconnues au nom du lieu d'un bon plan. Badge d'affichage seulement (aucun effet sur le tri :
// la mise en tête reste réservée aux offres sponsorisées).
import type { Deal } from "./types";

/** Noms en minuscules, sans accents ni apostrophes. À compléter au besoin. */
const CHAINS = [
  // Grandes surfaces
  "intermarche", "super u", "hyper u", "u express", "carrefour", "leclerc", "e.leclerc", "lidl", "aldi", "auchan",
  "casino", "geant casino", "monoprix", "franprix", "netto", "leader price", "biocoop", "picard", "action",
  // Restauration
  "mcdonalds", "mc donalds", "burger king", "kfc", "quick", "subway", "dominos", "pizza hut", "starbucks", "paul",
  // Sport, culture, loisirs
  "decathlon", "fnac", "cultura", "cineville", "pathe", "ugc", "cgr", "basic fit", "fitness park",
];

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f'’]/g, "")
    .replace(/-/g, " ");

/**
 * Vrai si le nom du lieu commence par une grande enseigne. Seul le nom est comparé (pas l'adresse, après « · »
 * ou la virgule), et en mots entiers : « Rue Paul Bert » ou « Pizza Paulo » ne comptent pas.
 */
export function isMajorChain({ place_name }: Pick<Deal, "place_name">) {
  if (!place_name) return false;
  const name = normalize(place_name.split(/ · |,/)[0]).trim();
  return CHAINS.some((chain) => name === chain || name.startsWith(`${chain} `));
}
