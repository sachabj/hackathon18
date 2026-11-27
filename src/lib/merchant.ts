// Espace commerçant (Justin) : lecture et écriture. Les droits sont garantis par la base (005_merchant.sql).
import { nearestZone, type Point } from "./geo";
import { getSupabase } from "./supabase/client";
import type { Business, Deal, DealCategory, OfferStats } from "./types";

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
      p_zone_id: nearestZone(input.position).zone.id,
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
export async function publishOffer(business: Business, offer: OfferInput) {
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

export async function boostOffer(dealId: string) {
  check(await getSupabase().rpc("boost_offer", { p_deal_id: dealId }));
}
