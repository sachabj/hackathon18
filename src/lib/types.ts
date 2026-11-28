// Types alignés sur supabase/schema.sql — toute modif du schéma doit être répercutée ici.

export type DealCategory =
  | "restaurant"
  | "supermarket"
  | "transport"
  | "scholarship"
  | "sport"
  | "activity";

/**
 * Condition pour profiter d'un bon plan (colonne deals.requirements, migration 012).
 * « Carte Sortir » n'est plus une catégorie : c'est une condition, comme la carte étudiante.
 */
export type DealRequirement = "student_card" | "carte_sortir" | "scholarship" | "under_26";

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
  /** Offre flash : avant cette heure, réservée aux détenteurs de l'Avant-Première (migration 032) */
  early_until?: string | null;
  /** Mise en avant payée par le commerçant (migration 005) */
  boosted_until?: string | null;
  /** Commerçant qui a retiré le bon plan d'un étudiant */
  ended_by?: string | null;
  /** Retirée après des signalements « Plus dispo » (migrations 016 puis 023) ; non écrivable par l'app */
  archived_at?: string | null;
  /** « Douteux » depuis cette date (migration 023) ; non écrivable par l'app */
  doubtful_since?: string | null;
  /** Sauvée à cette date : les signalements antérieurs ne comptent plus (migration 023) */
  reports_reset_at?: string | null;
  /** Conditions pour en profiter (migration 012) */
  requirements?: DealRequirement[] | null;
  /** Lien vers l'offre, http(s) uniquement (migration 012) */
  link_url?: string | null;
  /** Offre importée d'une source publique (migration 024) ; non écrivable par l'app */
  source_name?: string | null;
  /** Jour de la vérification de la source (AAAA-MM-JJ) */
  source_checked_at?: string | null;
}

export interface Vote {
  id: string;
  deal_id: string;
  user_id: string;
  value: 1 | -1;
  created_at: string;
}

/** Masses pondérées des réactions d'une offre (fonction `deal_trust`, migration 014). */
export interface DealTrust {
  pos: number;
  neg: number;
}

/**
 * Bon plan lu avec ses votes (`select("*, votes(*)")`) → fiabilité affichée sur les cartes.
 * `trust` : masses calculées par la base (poids des étudiants) ; absent → calcul local à poids égal.
 */
export type DealWithVotes = Deal & { votes?: Vote[]; trust?: DealTrust | null };

export interface Profile {
  id: string;
  username: string | null;
  role: "student" | "merchant";
  followed_categories: DealCategory[];
  followed_zone_ids: string[];
  /** Plus relevée depuis la migration 018 */
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
  /** Fréquence de voyage (migration 006 ; `wants_travel` n'est plus demandé) */
  home_visits?: HomeVisits | null;
  wants_travel?: boolean | null;
  travel_modes?: DealSubcategory[] | null;
  /** Aides (migration 010) : null = pas répondu */
  is_scholarship?: boolean | null;
  has_carte_sortir?: boolean | null;
  updated_at: string;
  /** École ou université, facultative (migration 022) */
  school?: string | null;
  /** École de la liste (migration 028) : compte au classement des écoles */
  school_id?: string | null;
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

/** Reçu d'une mise en avant payée (paiement simulé, migration 031). */
export interface BoostPayment {
  id: string;
  /** null : offre supprimée depuis */
  deal_id: string | null;
  offer_title: string;
  amount_cents: number;
  receipt_number: string;
  boosted_until: string;
  created_at: string;
}
