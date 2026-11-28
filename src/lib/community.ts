// Impact communautaire et parrainage (migration 022). Les totaux et les Flèches sont calculés par la base.
// Sans la migration, les lectures renvoient null (rien n'est affiché) et les enregistrements sont ignorés.
import { dbMessage } from "./i18n";
import { getSupabase } from "./supabase/client";

/** Montants affichés ; la base applique les mêmes (migration 022). */
export const REFERRAL = { referrer: 100, referee: 50, maxPaid: 10 } as const;

/** Chaque personne compte une fois, dans le total comme dans chaque ligne. */
export interface Impact {
  people_helped: number;
  via_deals: number;
  via_shares: number;
  validations: number;
  favorites: number;
  directions: number;
  shares: number;
  /** Mes « Plus dispo » confirmés par la communauté (non additionnés au total) */
  reports_confirmed: number;
}

export interface Referrals {
  referral_code: string;
  /** Amis ayant fait leur première action */
  friends: number;
  /** Inscrits avec le code, pas encore actifs */
  pending: number;
  /** Flèches gagnées en parrainant */
  arrows: number;
}

const MISSING = "PGRST202";

async function read<T>(name: "my_impact" | "my_referrals"): Promise<T | null> {
  const { data, error } = await getSupabase().rpc(name);
  if (!error) return data as T;
  if (error.code === MISSING) return null;
  throw new Error(error.message);
}

export const fetchImpact = () => read<Impact>("my_impact");
export const fetchReferrals = () => read<Referrals>("my_referrals");

export const referralLink = (code: string) => `${window.location.origin}/login?parrain=${encodeURIComponent(code)}`;

export const dealLink = (dealId: string, code: string | null) =>
  `${window.location.origin}/offre?id=${dealId}${code ? `&de=${encodeURIComponent(code)}` : ""}`;

/** Mon code, pour signer les liens partagés ; null s'il n'y en a pas (commerçant, base pas à jour). */
export async function fetchMyCode(): Promise<string | null> {
  const { data, error } = await getSupabase().rpc("ensure_referral_code");
  return error ? null : (data as string | null);
}

/** « Y aller » touché : une fois par étudiant et par offre. N'empêche jamais d'ouvrir l'itinéraire. */
export async function recordDirections(dealId: string) {
  const { error } = await getSupabase()
    .from("deal_directions")
    .upsert({ deal_id: dealId }, { onConflict: "deal_id,user_id", ignoreDuplicates: true });
  if (error) console.warn("Itinéraire non noté :", error.message);
}

/** Lien partagé ouvert : compte pour la personne qui l'a envoyé (sauf si c'est soi-même). */
export async function recordShareOpen(dealId: string, code: string) {
  const { error } = await getSupabase().rpc("record_share_open", { p_deal_id: dealId, p_code: code });
  if (error && error.code !== MISSING) console.warn("Ouverture du lien non notée :", error.message);
}

/** Vrai / faux, ou null si le code ne peut pas être vérifié (base pas à jour). */
export async function checkReferralCode(code: string): Promise<boolean | null> {
  const { data, error } = await getSupabase().rpc("check_referral_code", { p_code: code });
  if (!error) return data as boolean;
  if (error.code === MISSING) return null;
  throw new Error(error.message);
}

export async function sendSupportMessage(kind: "bug" | "help", message: string) {
  const { error } = await getSupabase().from("support_messages").insert({ kind, message });
  if (!error) return;
  throw new Error(
    error.code === "PGRST205" || error.code === "42P01"
      ? "La base de données n'est pas à jour : lancer supabase/migrations/022_profile_impact_referral.sql."
      : dbMessage(error.message),
  );
}

export async function saveSchool(userId: string, school: string) {
  const { error } = await getSupabase()
    .from("preferences")
    .upsert({ user_id: userId, school: school.trim() || null }, { onConflict: "user_id" });
  if (!error) return;
  throw new Error(
    error.code === "PGRST204"
      ? "La base de données n'est pas à jour : lancer supabase/migrations/022_profile_impact_referral.sql."
      : error.message,
  );
}
