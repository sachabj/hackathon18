// Compatibilité entre un bon plan et le profil d'un étudiant (voir memory/ARCHITECTURE.md § Personnalisation).
import { ACTIVITIES, BUDGET_PROFILES, CATEGORIES, TRANSPORT_MODES, ZONES } from "./constants";
import { distanceKm, formatDistance } from "./geo";
import type { ActivityId, BudgetProfile, Deal, DealCategory, Preferences, TransportMode } from "./types";

/** Ce que le score utilise : catégories et zones (profiles) + préférences privées. */
export interface StudentProfile {
  categories: DealCategory[]; // dans l'ordre de priorité
  zoneIds: string[];
  homeZoneId: string | null;
  position: { lat: number; lng: number } | null;
  transportModes: TransportMode[];
  budget: BudgetProfile | null;
  activities: ActivityId[];
}

export function toStudentProfile(
  profile: { followed_categories: DealCategory[]; followed_zone_ids: string[] },
  prefs: Preferences | null,
): StudentProfile {
  return {
    categories: profile.followed_categories,
    zoneIds: profile.followed_zone_ids,
    homeZoneId: prefs?.home_zone_id ?? null,
    position: prefs?.lat != null && prefs.lng != null ? { lat: prefs.lat, lng: prefs.lng } : null,
    transportModes: prefs?.transport_modes ?? [],
    budget: prefs?.budget_profile ?? null,
    activities: prefs?.activities ?? [],
  };
}

const WEIGHTS = { category: 40, location: 25, budget: 20, interest: 15 };
/** Points de budget selon le niveau de prix 0..3. */
const BUDGET_POINTS: Record<BudgetProfile, [number, number, number, number]> = {
  tight: [20, 18, 6, 0],
  balanced: [20, 20, 16, 4],
  comfort: [16, 17, 20, 20],
};
/** Portée quand aucun moyen de transport n'est renseigné. */
const DEFAULT_REACH_KM = 3;
export const FOR_YOU_MIN_SCORE = 55;

/** Durée estimée avec le premier moyen de transport de l'étudiant qui couvre la distance. */
function travelTime(km: number, modes: TransportMode[]) {
  const mode = (Object.keys(TRANSPORT_MODES) as TransportMode[]).find(
    (m) => modes.includes(m) && km <= TRANSPORT_MODES[m].reachKm,
  );
  if (!mode) return null;
  const { speedKmh, by, emoji } = TRANSPORT_MODES[mode];
  // × 1,3 : un trajet réel est plus long qu'à vol d'oiseau.
  return `${emoji} ≈ ${Math.max(1, Math.round(((km * 1.3) / speedKmh) * 60))} min ${by}`;
}

export interface Match {
  /** 0..100, ou null si le profil ne permet rien de comparer */
  score: number | null;
  forYou: boolean;
  reasons: string[];
  warnings: string[];
}

export function matchDeal(deal: Deal, me: StudentProfile): Match {
  let earned = 0;
  let max = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];

  // 1. Pôle de dépenses
  const rank = me.categories.indexOf(deal.category);
  if (me.categories.length > 0) {
    max += WEIGHTS.category;
    if (rank >= 0) {
      earned += WEIGHTS.category - 4 * Math.min(rank, 3);
      const { emoji, label } = CATEGORIES[deal.category];
      reasons.push(rank < 3 ? `${emoji} Ta priorité n°${rank + 1}` : `${emoji} Tu suis ${label}`);
    }
  }

  // 2. Localisation et transports
  let reachable = true;
  const home = ZONES.find((z) => z.id === me.homeZoneId);
  const zone = ZONES.find((z) => z.id === deal.zone_id);
  const origin = me.position ?? home;
  if (deal.scope === "local" && deal.lat !== null && deal.lng !== null && origin) {
    max += WEIGHTS.location;
    const km = distanceKm(origin, { lat: deal.lat, lng: deal.lng });
    const reach = me.transportModes.length
      ? Math.max(...me.transportModes.map((m) => TRANSPORT_MODES[m].reachKm))
      : DEFAULT_REACH_KM;
    if (km <= reach) {
      earned += WEIGHTS.location - 10 * (km / reach);
      reasons.push(
        travelTime(km, me.transportModes) ??
          `📍 À ${formatDistance(km)} ${me.position ? "de toi" : `de ${home?.name}`}`,
      );
    } else if (deal.zone_id && me.zoneIds.includes(deal.zone_id)) {
      earned += 10;
      reasons.push(`📍 Dans une zone que tu suis`);
    } else {
      reachable = false;
      warnings.push(`À ${formatDistance(km)} : loin pour tes transports`);
    }
  } else if (deal.scope === "zone" && deal.zone_id && me.zoneIds.length > 0) {
    max += WEIGHTS.location;
    if (me.zoneIds.includes(deal.zone_id)) {
      earned += deal.zone_id === me.homeZoneId ? WEIGHTS.location : 20;
      if (zone) reasons.push(`📍 Valable à ${zone.name}`);
    } else {
      reachable = false;
    }
  } else if (deal.scope === "national" && me.zoneIds.length > 0) {
    max += WEIGHTS.location;
    earned += 18;
  }

  // 3. Budget
  if (me.budget && deal.price_level != null) {
    max += WEIGHTS.budget;
    const points = BUDGET_POINTS[me.budget][deal.price_level] ?? 0;
    earned += points;
    if (deal.price_level === 0) reasons.push("🆓 Gratuit");
    else if (points >= 16) reasons.push(`${BUDGET_PROFILES[me.budget].emoji} Dans ton budget`);
    else warnings.push("Au-dessus de ton budget habituel");
  }

  // 4. Activités et transports empruntés
  let interest = false;
  const tags = (deal.tags ?? []).filter((t): t is ActivityId => t in ACTIVITIES);
  if (tags.length > 0 && me.activities.length > 0) {
    max += WEIGHTS.interest;
    const liked = tags.find((t) => me.activities.includes(t));
    if (liked) {
      interest = true;
      earned += WEIGHTS.interest;
      reasons.unshift(`${ACTIVITIES[liked].emoji} Tu aimes : ${ACTIVITIES[liked].label}`);
    }
  } else if (deal.subcategory && me.transportModes.length > 0) {
    max += WEIGHTS.interest;
    const mode = TRANSPORT_MODES[deal.subcategory];
    if (me.transportModes.includes(deal.subcategory)) {
      interest = true;
      earned += WEIGHTS.interest;
      reasons.unshift(`${mode.emoji} Tu voyages ${mode.by}`);
    }
  }

  const score = max > 0 ? Math.round((100 * earned) / max) : null;
  return {
    score,
    forYou: score !== null && score >= FOR_YOU_MIN_SCORE && reachable && (rank >= 0 || interest),
    reasons,
    warnings,
  };
}

/** Bons plans accompagnés de leur compatibilité, les plus adaptés d'abord puis les plus récents. */
export function rankDeals<T extends Deal>(deals: T[], me: StudentProfile) {
  return deals
    .map((deal) => ({ deal, match: matchDeal(deal, me) }))
    .sort(
      (a, b) =>
        (b.match.score ?? -1) - (a.match.score ?? -1) ||
        b.deal.created_at.localeCompare(a.deal.created_at),
    );
}
