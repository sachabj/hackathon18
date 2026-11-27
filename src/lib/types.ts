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
  author_id: string;
  created_at: string;
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
  created_at: string;
}

/** Ligne de la vue `user_contributions` */
export interface UserContribution {
  user_id: string;
  category: DealCategory;
  count_7d: number;
  count_30d: number;
}
