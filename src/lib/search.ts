// Recherche de l'accueil : filtre les bons plans déjà chargés (rien n'est envoyé à un serveur).
import { CATEGORIES, REQUIREMENTS, SUBCATEGORIES, ZONES } from "./constants";
import type { Deal } from "./types";

/** Sans majuscules ni accents, pour que « cine » trouve « Ciné ». */
const normalize = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").replace(/’/g, "'").toLowerCase();

const searchableText = (deal: Deal) =>
  normalize(
    [
      deal.title,
      deal.description,
      deal.place_name,
      deal.price_info,
      deal.scope === "national" ? "Partout en France" : ZONES.find((z) => z.id === deal.zone_id)?.name,
      CATEGORIES[deal.category].label,
      deal.subcategory && SUBCATEGORIES[deal.subcategory].label,
      ...(deal.requirements ?? []).map((r) => REQUIREMENTS[r].label),
    ]
      .filter(Boolean)
      .join(" "),
  );

/** Vrai si le bon plan contient tous les mots saisis (toujours vrai sans saisie). */
export function matchesQuery(deal: Deal, query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = searchableText(deal);
  return words.every((word) => text.includes(word));
}
