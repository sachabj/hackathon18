import type { ActivityId, BudgetProfile, DealCategory, DealSubcategory, HomeVisits, TransportMode } from "./types";

export const APP_NAME = "ShareWood";

/** Longueur minimale d'un nouveau mot de passe. */
export const PASSWORD_MIN = 8;
/** Adresse de contact affichée dans la politique de confidentialité (rien n'est affiché tant qu'elle est vide). */
export const PRIVACY_CONTACT = "";

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

/** Zones de démo (doivent correspondre à la table `zones` de supabase/schema.sql). Coordonnées vérifiées sur OpenStreetMap. */
export const ZONES = [
  { id: "bruz", name: "Bruz", lat: 48.0245, lng: -1.746, radiusM: 3000 },
  { id: "ker-lann", name: "Ker Lann", lat: 48.0505, lng: -1.742, radiusM: 1500 },
  { id: "rennes", name: "Rennes", lat: 48.1113, lng: -1.68, radiusM: 4000 },
] as const;

export const MAP_CENTER: [number, number] = [48.038, -1.744];

// ---------- Préférences ----------
/** reachKm : distance « à portée » (à vol d'oiseau) · speedKmh : pour estimer la durée du trajet. */
export const TRANSPORT_MODES: Record<
  TransportMode,
  { label: string; emoji: string; reachKm: number; speedKmh: number; by: string }
> = {
  walk: { label: "À pied", emoji: "🚶", reachKm: 1.5, speedKmh: 4.8, by: "à pied" },
  bike: { label: "Vélo", emoji: "🚲", reachKm: 5, speedKmh: 15, by: "à vélo" },
  bus: { label: "Bus / métro", emoji: "🚌", reachKm: 12, speedKmh: 18, by: "en bus" },
  car: { label: "Voiture", emoji: "🚗", reachKm: 25, speedKmh: 30, by: "en voiture" },
  carpool: { label: "Covoiturage", emoji: "🤝", reachKm: 20, speedKmh: 30, by: "en covoiturage" },
  train: { label: "Train", emoji: "🚆", reachKm: 15, speedKmh: 40, by: "en train" },
  plane: { label: "Avion", emoji: "✈️", reachKm: 0, speedKmh: 0, by: "en avion" },
};

export const BUDGET_PROFILES: Record<BudgetProfile, { label: string; emoji: string; hint: string }> = {
  tight: { label: "Serré", emoji: "🪙", hint: "Chaque euro compte : le gratuit et les petits prix d'abord." },
  balanced: { label: "Équilibré", emoji: "⚖️", hint: "Je me fais plaisir, en faisant attention." },
  comfort: { label: "Confort", emoji: "✨", hint: "La qualité avant tout, si l'offre vaut le coup." },
};

export const HOME_VISITS: Record<HomeVisits, { label: string; emoji: string; hint: string }> = {
  often: { label: "Souvent", emoji: "🔁", hint: "Plusieurs fois par mois" },
  sometimes: { label: "Parfois", emoji: "📅", hint: "Surtout aux vacances" },
  never: { label: "Rarement", emoji: "🛋️", hint: "Ou presque jamais" },
};

/** Moyens proposés pour les longs trajets (mêmes ids que deals.subcategory). */
export const TRAVEL_MODES: DealSubcategory[] = ["train", "plane", "bus", "carpool"];

/** Niveau de prix d'un bon plan (colonne deals.price_level), à proposer dans le formulaire de publication. */
export const PRICE_LEVELS = [
  { value: 0, label: "Gratuit" },
  { value: 1, label: "€ · moins de 10 €" },
  { value: 2, label: "€€ · 10 à 25 €" },
  { value: 3, label: "€€€ · plus de 25 €" },
] as const;

/** Activités (préférences de l'étudiant et colonne deals.tags). */
export const ACTIVITIES: Record<ActivityId, { label: string; emoji: string }> = {
  cinema: { label: "Ciné", emoji: "🍿" },
  music: { label: "Concerts", emoji: "🎵" },
  nightlife: { label: "Soirées", emoji: "🎉" },
  games: { label: "Jeux", emoji: "🎲" },
  culture: { label: "Culture", emoji: "🎭" },
  swimming: { label: "Piscine", emoji: "🏊" },
  fitness: { label: "Fitness", emoji: "🏋️" },
  team_sport: { label: "Sports co", emoji: "🏀" },
  outdoor: { label: "Plein air", emoji: "🥾" },
};
