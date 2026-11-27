// Compatibilité avec les données d'avant la migration 012 (tant qu'elle n'est pas lancée partout).
import { CATEGORIES, REQUIREMENTS } from "./constants";
import type { Deal, DealCategory, DealRequirement } from "./types";

/**
 * « carte_sortir » était une catégorie : l'offre est lue comme une activité avec la condition Carte Sortir.
 * Les conditions inconnues sont ignorées.
 */
export function normalizeDeal<T extends Deal>(deal: T): T {
  const requirements = (deal.requirements ?? []).filter((r): r is DealRequirement => r in REQUIREMENTS);
  if ((deal.category as string) === "carte_sortir") {
    return {
      ...deal,
      category: "activity",
      requirements: requirements.includes("carte_sortir") ? requirements : [...requirements, "carte_sortir"],
    };
  }
  return requirements.length === (deal.requirements ?? []).length ? deal : { ...deal, requirements };
}

/** Catégories encore existantes (un profil peut encore suivre « carte_sortir »). */
export const knownCategories = (list: DealCategory[]) => list.filter((c) => c in CATEGORIES);
