import {
  BasketballIcon,
  BikeIcon,
  BootIcon,
  BusIcon,
  CalendarIcon,
  CarIcon,
  CoinIcon,
  DiceIcon,
  GraduationCapIcon,
  IdCardIcon,
  DumbbellIcon,
  HandshakeIcon,
  MaskIcon,
  MusicNoteIcon,
  PartyIcon,
  PlaneIcon,
  PopcornIcon,
  RepeatIcon,
  ScaleIcon,
  SofaIcon,
  SparklesIcon,
  SwimIcon,
  TicketIcon,
  TrainIcon,
  UserIcon,
  WalkIcon,
} from "@/components/icons";
import type {
  ActivityId,
  BudgetProfile,
  DealCategory,
  DealRequirement,
  DealSubcategory,
  HomeVisits,
  TransportMode,
} from "./types";
import type { ComponentType } from "react";

export const APP_NAME = "ShareWood";

/** Distance maximale à une offre placée pour gagner des Flèches (la base applique la même : migration 020). */
export const NEARBY_M = 500;
/** Longueur maximale du titre d'une offre (contrainte deals_title_length, migration 025). */
export const TITLE_MAX = 100;
/** Analyses de l'assistant IA par jour et par compte (la base applique la même : migration 025). */
export const AI_DAILY_LIMIT = 30;
/** Longueur minimale d'un nouveau mot de passe. */
export const PASSWORD_MIN = 8;
/**
 * Contact affiché dans la politique de confidentialité. FICTIF (hackathon) : le domaine example.com est réservé,
 * personne ne reçoit ces messages. À remplacer par une vraie adresse avant toute mise en service.
 */
export const PRIVACY_CONTACT = "sharewood@example.com (adresse fictive, démonstration)";

type IconComponent = ComponentType<{ className?: string }>;

/** `color` = fond du rond de `CategoryIcon` pour cette catégorie (voir DESIGN_SHAREWOOD.md). */
export const CATEGORIES: Record<DealCategory, { label: string; color: string }> = {
  restaurant: { label: "Restaurants", color: "#CFE3CA" },
  supermarket: { label: "Grandes surfaces", color: "#1E3A2F" },
  transport: { label: "Transports", color: "#1E3A2F" },
  scholarship: { label: "Bourses & aides", color: "#E6DFF0" },
  sport: { label: "Sport", color: "#CFE3CA" },
  activity: { label: "Activités", color: "#4B2A63" },
};

export const SUBCATEGORIES: Record<DealSubcategory, { label: string; Icon: IconComponent }> = {
  plane: { label: "Avion", Icon: PlaneIcon },
  train: { label: "Train", Icon: TrainIcon },
  bus: { label: "Bus", Icon: BusIcon },
  carpool: { label: "Covoiturage", Icon: HandshakeIcon },
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
  { label: string; Icon: IconComponent; reachKm: number; speedKmh: number; by: string }
> = {
  walk: { label: "À pied", Icon: WalkIcon, reachKm: 1.5, speedKmh: 4.8, by: "à pied" },
  bike: { label: "Vélo", Icon: BikeIcon, reachKm: 5, speedKmh: 15, by: "à vélo" },
  bus: { label: "Bus / métro", Icon: BusIcon, reachKm: 12, speedKmh: 18, by: "en bus" },
  car: { label: "Voiture", Icon: CarIcon, reachKm: 25, speedKmh: 30, by: "en voiture" },
  carpool: { label: "Covoiturage", Icon: HandshakeIcon, reachKm: 20, speedKmh: 30, by: "en covoiturage" },
  train: { label: "Train", Icon: TrainIcon, reachKm: 15, speedKmh: 40, by: "en train" },
  plane: { label: "Avion", Icon: PlaneIcon, reachKm: 0, speedKmh: 0, by: "en avion" },
};

export const BUDGET_PROFILES: Record<BudgetProfile, { label: string; Icon: IconComponent; hint: string }> = {
  tight: { label: "Serré", Icon: CoinIcon, hint: "Chaque euro compte : le gratuit et les petits prix d'abord." },
  balanced: { label: "Équilibré", Icon: ScaleIcon, hint: "Je me fais plaisir, en faisant attention." },
  comfort: { label: "Confort", Icon: SparklesIcon, hint: "La qualité avant tout, si l'offre vaut le coup." },
};

export const HOME_VISITS: Record<HomeVisits, { label: string; Icon: IconComponent; hint: string }> = {
  often: { label: "Souvent", Icon: RepeatIcon, hint: "Plusieurs fois par mois" },
  sometimes: { label: "Parfois", Icon: CalendarIcon, hint: "Surtout aux vacances" },
  never: { label: "Rarement", Icon: SofaIcon, hint: "Ou presque jamais" },
};

/**
 * Catégories réservées à ceux qui y ont droit : elles ne sont pas proposées comme priorités à l'inscription,
 * et n'entrent dans « Pour toi » que selon la réponse « Boursier ? ».
 */
export const ELIGIBILITY_CATEGORIES: DealCategory[] = ["scholarship"];

/**
 * Conditions pour profiter d'un bon plan (colonne deals.requirements, migration 012).
 * Les mêmes valeurs sont imposées en base : en ajouter une = migration.
 */
export const REQUIREMENTS: Record<DealRequirement, { label: string; Icon: IconComponent }> = {
  student_card: { label: "Carte étudiante", Icon: IdCardIcon },
  carte_sortir: { label: "Carte Sortir", Icon: TicketIcon },
  scholarship: { label: "Boursiers", Icon: GraduationCapIcon },
  under_26: { label: "Moins de 26 ans", Icon: UserIcon },
};

/** Longueur maximale d'un lien d'offre (contrainte deals_link_url_check). */
export const LINK_MAX = 500;

/** Page d'information sur la Carte Sortir. */
export const CARTE_SORTIR_URL = "https://metropole.rennes.fr";

/** Menu « pays → ville-campus » de l'inscription (ids de ZONES). */
export const COUNTRIES = [{ id: "fr", name: "France", zoneIds: ["rennes", "bruz", "ker-lann"] }] as const;

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
export const ACTIVITIES: Record<ActivityId, { label: string; Icon: IconComponent }> = {
  cinema: { label: "Ciné", Icon: PopcornIcon },
  music: { label: "Concerts", Icon: MusicNoteIcon },
  nightlife: { label: "Soirées", Icon: PartyIcon },
  games: { label: "Jeux", Icon: DiceIcon },
  culture: { label: "Culture", Icon: MaskIcon },
  swimming: { label: "Piscine", Icon: SwimIcon },
  fitness: { label: "Fitness", Icon: DumbbellIcon },
  team_sport: { label: "Sports co", Icon: BasketballIcon },
  outdoor: { label: "Plein air", Icon: BootIcon },
};
