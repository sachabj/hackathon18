"use client";

// Signaler un bon plan (tâche 71) : motif + description, distinct de « Plus dispo » (qui mesure la disponibilité).
// L'offre signalée est masquée pour la personne qui signale, partout (accueil, recherche, carte, favoris).
// Table `deal_reports` (migration 029) ; secours sur l'appareil si elle manque, pour que l'offre reste masquée.
import { currentUserId } from "./engagement";
import { getSupabase, isSupabaseConfigured } from "./supabase/client";

export const REPORT_REASONS = [
  { id: "scam", label: "Arnaque ou fausse offre" },
  { id: "inappropriate", label: "Contenu inapproprié ou offensant" },
  { id: "wrong_info", label: "Informations fausses (lieu, dates, conditions)" },
  { id: "duplicate", label: "Doublon d'une autre offre" },
  { id: "other", label: "Autre" },
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number]["id"];

export const REPORT_DETAILS_MAX = 500;
/** Longueur minimale de l'explication pour « Autre » (même règle en base, 029). */
export const REPORT_OTHER_MIN = 3;

// ---------- Secours sur l'appareil (par compte) ----------
const localKey = (userId: string) => `sw-reported:${userId}`;

function readLocal(userId: string): string[] {
  try {
    const raw = window.localStorage.getItem(localKey(userId));
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function addLocal(userId: string, dealId: string) {
  try {
    const list = readLocal(userId);
    if (!list.includes(dealId)) window.localStorage.setItem(localKey(userId), JSON.stringify([...list, dealId]));
  } catch {
    // Stockage indisponible (navigation privée) : l'offre reste masquée jusqu'au rechargement.
  }
}

/** Offres signalées par l'utilisateur connecté (base + appareil). */
export async function fetchReportedIds(): Promise<Set<string>> {
  if (!isSupabaseConfigured) return new Set();
  const userId = await currentUserId();
  if (!userId) return new Set();
  const ids = new Set(readLocal(userId));
  // RLS : chacun ne lit que ses signalements. Sans la migration 029 : seulement l'appareil.
  const { data } = await getSupabase().from("deal_reports").select("deal_id");
  for (const row of (data ?? []) as { deal_id: string }[]) ids.add(row.deal_id);
  return ids;
}

/**
 * Envoie le signalement. `sent` faux : la base ne l'a pas reçu (migration absente, réseau…), mais l'offre est quand
 * même masquée sur cet appareil. Une erreur n'est levée que pour une saisie refusée.
 */
export async function reportDeal(dealId: string, reason: ReportReason, details: string): Promise<{ sent: boolean }> {
  const userId = await currentUserId();
  if (!userId) throw new Error("Connecte-toi pour signaler un bon plan.");
  const text = details.trim().slice(0, REPORT_DETAILS_MAX);
  if (reason === "other" && text.length < REPORT_OTHER_MIN) throw new Error("Explique en quelques mots ce qui ne va pas.");
  addLocal(userId, dealId);
  const { error } = await getSupabase()
    .from("deal_reports")
    .insert({ deal_id: dealId, reason, details: text || null });
  // 23505 : déjà signalé par ce compte, c'est bien enregistré.
  if (!error || error.code === "23505") return { sent: true };
  // Limite du jour atteinte (message de la base) : on le montre tel quel.
  if (error.code === "P0001") throw new Error(error.message);
  return { sent: false };
}

// ---------- Prévenir les listes ouvertes (masquage immédiat) ----------
const EVENT = "sharewood:reported";

export function announceReported(dealId: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: dealId }));
}

export function onReported(listener: (dealId: string) => void) {
  const handle = (e: Event) => listener((e as CustomEvent<string>).detail);
  window.addEventListener(EVENT, handle);
  return () => window.removeEventListener(EVENT, handle);
}
