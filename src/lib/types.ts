// Types alignés sur supabase/schema.sql — toute modif du schéma doit être répercutée ici.

export type DealCategory =
  | "restaurant"
  | "supermarket"
  | "transport"
  | "scholarship"
  | "sport"
  | "carte_sortir"
  | "activity";

export type DealSubcategory = "plane" | "train" | "bus" | "carpool";

/** local = point sur la carte · zone = valable sur une zone · national = partout */
export type DealScope = "local" | "zone" | "national";

export interface Deal {
  id: string;
  title: string;
  description: string | null;
  category: DealCategory;
  subcategory: DealSubcategory | null;
  scope: DealScope;
  zone_id: string | null;
  place_name: string | null;
  lat: number | null;
  lng: number | null;
  price_info: string | null;
  expires_at: string | null;
  deadline_at: string | null;
  is_official: boolean;
  ended_by_merchant: boolean;
  /** null : l'auteur a supprimé son compte (migration 009) */
  author_id: string | null;
  created_at: string;
  /** 0 = gratuit, 1 = €, 2 = €€, 3 = €€€ (voir PRICE_LEVELS) */
  price_level?: number | null;
  /** Activités liées (ids de ACTIVITIES) */
  tags?: string[] | null;
  /** Photo de preuve (stockage public `deal-photos`, migration 008) */
  photo_url?: string | null;
  /** Mise en avant payée par le commerçant (migration 005) */
  boosted_until?: string | null;
  /** Commerçant qui a retiré le bon plan d'un étudiant */
  ended_by?: string | null;
}

export interface Vote {
  id: string;
  deal_id: string;
  user_id: string;
  value: 1 | -1;
  created_at: string;
}

export interface Favorite {
  user_id: string;
  deal_id: string;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string | null;
  role: "student" | "merchant";
  followed_categories: DealCategory[];
  followed_zone_ids: string[];
  last_contribution_at: string | null;
  onboarded: boolean;
  /** Acceptation de la politique de confidentialité (migration 009) */
  privacy_accepted_at?: string | null;
  created_at: string;
}

/** Ligne de la vue `user_contributions` */
export interface UserContribution {
  user_id: string;
  category: DealCategory;
  count_7d: number;
  count_30d: number;
}

export type TransportMode = "walk" | "bike" | "bus" | "train" | "car" | "carpool" | "plane";

export type BudgetProfile = "tight" | "balanced" | "comfort";

export type HomeVisits = "often" | "sometimes" | "never";

export type ActivityId =
  | "cinema"
  | "music"
  | "nightlife"
  | "games"
  | "culture"
  | "swimming"
  | "fitness"
  | "team_sport"
  | "outdoor";

/** Ligne de la table `preferences` (privée : lisible par son seul propriétaire). */
export interface Preferences {
  user_id: string;
  home_zone_id: string | null;
  lat: number | null;
  lng: number | null;
  transport_modes: TransportMode[];
  budget_profile: BudgetProfile | null;
  activities: ActivityId[];
  /** Retours chez les parents, envies de voyage (migration 006) */
  home_visits?: HomeVisits | null;
  wants_travel?: boolean | null;
  travel_modes?: DealSubcategory[] | null;
  updated_at: string;
}

/** Ligne de la table `businesses` (un commerce par compte commerçant). */
export interface Business {
  owner_id: string;
  name: string;
  address: string | null;
  category: DealCategory;
  zone_id: string | null;
  lat: number;
  lng: number;
  created_at: string;
}

/** Résultat de la fonction `my_offer_stats` */
export interface OfferStats {
  deal_id: string;
  confirmations: number;
  reports: number;
  favorites: number;
}

/** Résultat de la fonction `my_deal_audience` (migration 007) */
export interface DealAudience {
  deal_id: string;
  views: number;
  visits: number;
  favorites: number;
  confirmations: number;
  reports: number;
}
