// Types partagés entre la route /api/assist (serveur) et le formulaire de publication (navigateur).
import type { ActivityId, DealCategory, DealScope, DealSubcategory } from "@/lib/types";

/** Brouillon de bon plan extrait d'un texte libre ou d'une photo (champs inconnus = null). */
export interface AssistDraft {
  title: string | null;
  category: DealCategory | null;
  subcategory: DealSubcategory | null;
  scope: DealScope | null;
  store_name: string | null;
  city: string | null;
  price_info: string | null;
  price_level: 0 | 1 | 2 | 3 | null;
  description: string | null;
  tags: ActivityId[];
  /** YYYY-MM-DD */
  expires_on: string | null;
  deadline_on: string | null;
  confidence: "haute" | "moyenne" | "basse";
  notes: string | null;
}

export type AssistRequest =
  | { action: "extract"; text?: string; image?: { media_type: "image/jpeg" | "image/png" | "image/webp"; data: string } };

export type AssistResponse<T> = { ok: true; result: T } | { ok: false; error: string; unavailable?: boolean };
