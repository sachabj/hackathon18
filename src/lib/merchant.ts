// Espace commerçant (Justin) : lecture et écriture. Les droits sont garantis par la base (005_merchant.sql).
import { settleDoubtfulDeals } from "./engagement";
import type { Point } from "./geo";
import { zoneAround } from "./zones";
import { getSupabase } from "./supabase/client";
import type { BoostPayment, Business, Deal, DealCategory, OfferStats } from "./types";

/** Catégories possibles pour un commerce (même liste que la contrainte SQL). */
export const BUSINESS_CATEGORIES: DealCategory[] = ["restaurant", "supermarket", "activity", "sport"];

/** Prix affiché de la mise en avant (paiement simulé). */
export const BOOST_PRICE = "9,90 €";
export const BOOST_DAYS = 7;

export const isBoosted = (deal: Pick<Deal, "boosted_until" | "ended_by_merchant">, now = Date.now()) =>
  !deal.ended_by_merchant && !!deal.boosted_until && new Date(deal.boosted_until).getTime() > now;

export interface Dashboard {
  business: Business | null;
  offers: Deal[];
  stats: Record<string, OfferStats>;
  /** Signalements d'étudiants à côté du commerce */
  nearby: Deal[];
  /** Instant de la lecture, pour juger si une offre est encore en ligne */
  fetchedAt: number;
}

function check<T>(result: { data: T; error: { code?: string; message: string } | null }): T {
  const { error } = result;
  if (!error) return result.data;
  // Table ou fonction absente : la migration n'a pas encore été lancée sur la base.
  if (["PGRST205", "PGRST202", "42P01"].includes(error.code ?? "")) {
    throw new Error("La base de données n'est pas à jour : lancer supabase/migrations/005_merchant.sql.");
  }
  throw new Error(error.message);
}

export async function fetchDashboard(): Promise<Dashboard> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Session expirée : reconnecte-toi.");

  const business = check(
    await supabase.from("businesses").select("*").eq("owner_id", user.id).maybeSingle(),
  ) as Business | null;
  if (!business) return { business, offers: [], stats: {}, nearby: [], fetchedAt: Date.now() };

  // Avant de lire : une offre douteuse arrivée à échéance ne doit plus apparaître « en ligne ».
  await settleDoubtfulDeals();
  const [offers, stats, nearby] = await Promise.all([
    supabase.from("deals").select("*").eq("author_id", user.id).order("created_at", { ascending: false }),
    supabase.rpc("my_offer_stats"),
    supabase.rpc("deals_near_my_business"),
  ]);
  return {
    business,
    offers: check(offers) as Deal[],
    stats: Object.fromEntries((check(stats) as OfferStats[]).map((s) => [s.deal_id, s])),
    nearby: check(nearby) as Deal[],
    fetchedAt: Date.now(),
  };
}

export async function registerBusiness(input: {
  name: string;
  address: string;
  category: DealCategory;
  position: Point;
}) {
  check(
    await getSupabase().rpc("register_business", {
      p_name: input.name,
      p_address: input.address,
      p_category: input.category,
      p_zone_id: zoneAround(input.position)?.id ?? null,
      p_lat: input.position.lat,
      p_lng: input.position.lng,
    }),
  );
}

/** Champs saisis dans le formulaire d'offre (création et modification). */
export type OfferInput = Pick<
  Deal,
  "title" | "description" | "category" | "price_info" | "price_level" | "expires_at"
>;

/** Une offre officielle est placée à l'adresse du commerce. */
/** `flash` : visible 1 h avant tout le monde par les étudiants « Avant-Première » (durée fixée par la base, 032). */
export async function publishOffer(business: Business, offer: OfferInput, flash = false) {
  check(
    await getSupabase()
      .from("deals")
      .insert({
        ...offer,
        scope: "local",
        zone_id: business.zone_id,
        place_name: business.name,
        lat: business.lat,
        lng: business.lng,
        is_official: true,
        // Colonne envoyée seulement pour une offre flash : la publication simple marche sans la migration 032.
        ...(flash ? { early_until: new Date().toISOString() } : {}),
      }),
  );
}

export async function updateOffer(dealId: string, offer: OfferInput) {
  check(await getSupabase().from("deals").update(offer).eq("id", dealId));
}

export async function setOfferEnded(dealId: string, ended: boolean) {
  check(await getSupabase().from("deals").update({ ended_by_merchant: ended }).eq("id", dealId));
}

export async function setNearbyDealEnded(dealId: string, ended: boolean) {
  check(await getSupabase().rpc("set_nearby_deal_ended", { p_deal_id: dealId, p_ended: ended }));
}

// ---------- Mise en avant payante (paiement simulé, migration 031) ----------
export const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

function paymentError(error: { code?: string; message: string }) {
  return new Error(
    ["PGRST202", "PGRST205", "42P01"].includes(error.code ?? "")
      ? "La base de données n'est pas à jour : lancer supabase/migrations/031_boost_payments.sql."
      : error.message,
  );
}

/** Paie (simulation) la mise en avant d'une offre : la base l'active et renvoie le reçu. */
export async function payBoost(dealId: string): Promise<BoostPayment> {
  const { data, error } = await getSupabase().rpc("pay_boost", { p_deal_id: dealId });
  if (error) throw paymentError(error);
  return data as BoostPayment;
}

/** Les reçus du commerçant connecté (la base ne donne que les siens), du plus récent au plus ancien. */
export async function fetchPayments(): Promise<BoostPayment[]> {
  const { data, error } = await getSupabase().from("boost_payments").select("*").order("created_at", { ascending: false });
  if (error) throw paymentError(error);
  return data as BoostPayment[];
}

// ---------- Bons de la boutique présentés en caisse (tâche 42, migration 030) ----------
export interface Voucher {
  code: string;
  title: string;
  partner: string;
  created_at: string;
  /** null : pas encore utilisé */
  used_at: string | null;
}

function voucherError(error: { code?: string; message: string }) {
  return new Error(
    error.code === "PGRST202" ? "La base de données n'est pas à jour : lancer supabase/migrations/030_voucher_check.sql." : error.message,
  );
}

/** Le bon correspondant au code, ou null s'il n'existe pas. */
export async function checkVoucher(code: string): Promise<Voucher | null> {
  const { data, error } = await getSupabase().rpc("check_voucher", { p_code: code });
  if (error) throw voucherError(error);
  return data as Voucher | null;
}

/** Valide le bon (une seule fois) et le renvoie à jour. */
export async function validateVoucher(code: string): Promise<Voucher> {
  const { data, error } = await getSupabase().rpc("validate_voucher", { p_code: code });
  if (error) throw voucherError(error);
  return data as Voucher;
}
