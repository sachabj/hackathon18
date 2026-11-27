import type { DealCategory, DealSubcategory } from "./types";

export const APP_NAME = "Waze-Etu";

export const CATEGORIES: Record<DealCategory, { label: string; emoji: string; color: string }> = {
  restaurant: { label: "Restaurants", emoji: "🍔", color: "#f97316" },
  supermarket: { label: "Grandes surfaces", emoji: "🛒", color: "#22c55e" },
  transport: { label: "Transports", emoji: "🚆", color: "#3b82f6" },
  scholarship: { label: "Bourses & aides", emoji: "🎓", color: "#a855f7" },
  sport: { label: "Licence de sport", emoji: "⚽", color: "#ef4444" },
  carte_sortir: { label: "Carte Sortir", emoji: "🎟️", color: "#ec4899" },
  activity: { label: "Activités", emoji: "🎬", color: "#eab308" },
};

export const SUBCATEGORIES: Record<DealSubcategory, { label: string; emoji: string }> = {
  plane: { label: "Avion", emoji: "✈️" },
  train: { label: "Train", emoji: "🚆" },
  bus: { label: "Bus", emoji: "🚌" },
  carpool: { label: "Covoiturage", emoji: "🚗" },
};

/** Zones de démo (doivent correspondre à la table `zones` de supabase/schema.sql). Coordonnées à vérifier. */
export const ZONES = [
  { id: "bruz", name: "Bruz", lat: 48.0245, lng: -1.746, radiusM: 3000 },
  { id: "ker-lann", name: "Ker Lann", lat: 48.0505, lng: -1.742, radiusM: 1500 },
] as const;

export const MAP_CENTER: [number, number] = [48.038, -1.744];
