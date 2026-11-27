// « Les Flèches » côté navigateur : barème affiché, rangs, lecture et messages de gain.
// Les Flèches sont calculées par la base (supabase/migrations/020_location_rules.sql) : garder le barème identique.
import { NEARBY_M } from "./constants";
import { currentPosition } from "./location";
import { getSupabase } from "./supabase/client";

/** Offre placée sur la carte : il faut être sur place (position partagée à 500 m au plus). */
export const ARROWS = { create: 50, bonus: 30, confirm: 10, report: 15 } as const;
/** Offre sans lieu précis : rien à vérifier, donc bien moins. */
export const ARROWS_NO_PLACE = { create: 20, bonus: 10, confirm: 3, report: 5 } as const;
export const arrowsFor = (placed: boolean) => (placed ? ARROWS : ARROWS_NO_PLACE);
export const DAILY_PAID_VOTES = 5;
export const DAILY_PAID_CREATIONS = 3;
export const STREAK_DAYS = 3;

export type ArrowKind = keyof typeof ARROWS;

export const KIND_LABELS: Record<ArrowKind | "spend", string> = {
  spend: "Échange",
  create: "Bon plan partagé",
  bonus: "Confirmé par 3 étudiants",
  confirm: "Confirmation",
  report: "Signalement d'expiration",
};

/** Rangs selon le solde, du plus bas au plus haut. */
export const RANKS = [
  { min: 0, label: "Éclaireur" },
  { min: 150, label: "Chasseur de bons plans" },
  { min: 500, label: "Robin des Étudiants" },
] as const;

/** Rang actuel, rang suivant et avancement (0..1) vers celui-ci. */
export function rankFor(total: number) {
  const index = RANKS.findLastIndex((r) => total >= r.min);
  const rank = RANKS[Math.max(0, index)];
  const next = RANKS[index + 1] ?? null;
  return {
    rank,
    next,
    missing: next ? next.min - total : 0,
    progress: next ? (total - rank.min) / (next.min - rank.min) : 1,
  };
}

export interface ArrowEvent {
  id: string | number;
  /** "spend" : récompense échangée (montant négatif, migration 017) */
  kind: ArrowKind | "spend";
  amount: number;
  multiplier: number;
  /** false : signalement en attente de deux autres étudiants */
  paid: boolean;
  created_at: string;
  /** null : offre supprimée depuis */
  title: string | null;
}

export interface MyArrows {
  /** Flèches gagnées : fixent le rang, une dépense ne les change pas */
  total_arrows_earned: number;
  /** Gagnées moins dépensées : sert à échanger (négatif si des gains sont retirés après un échange) */
  current_arrows_balance: number;
  /** Avantages activés dans l'application (migration 017) */
  golden_badge: boolean;
  early_access_until: string | null;
  pending: number;
  /** Jours consécutifs d'activité */
  streak: number;
  today_votes: number;
  history: ArrowEvent[];
}

/** Ses Flèches, ou null sans la migration 016 (rien n'est alors affiché). */
export async function fetchMyArrows(): Promise<MyArrows | null> {
  const { data, error } = await getSupabase().rpc("my_arrows");
  if (error) {
    if (error.code !== "PGRST202") console.warn("Flèches indisponibles :", error.message);
    return null;
  }
  // Avec la seule migration 016 : pas encore de boutique, le solde est le total gagné.
  const raw = data as Partial<MyArrows> & Pick<MyArrows, "pending" | "streak" | "today_votes" | "history"> & { total: number };
  const earned = raw.total_arrows_earned ?? raw.total;
  return {
    ...raw,
    total_arrows_earned: earned,
    current_arrows_balance: raw.current_arrows_balance ?? earned,
    golden_badge: raw.golden_badge ?? false,
    early_access_until: raw.early_access_until ?? null,
  };
}

/** Une ligne de l'historique complet, avec l'offre concernée. */
export type ArrowLine = ArrowEvent & { deal_id: string | null };

/**
 * Tous ses gains et ses échanges, les plus récents d'abord (lecture limitée à ses propres lignes),
 * ou null sans la migration 016.
 */
export async function fetchArrowLog(): Promise<ArrowLine[] | null> {
  const supabase = getSupabase();
  const [gains, spends] = await Promise.all([
    supabase
      .from("arrow_events")
      .select("id, deal_id, kind, amount, multiplier, paid, created_at, deals(title)")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("user_rewards").select("id, cost, created_at, rewards(title)").order("created_at", { ascending: false }),
  ]);
  if (gains.error) return null;
  type Gain = Omit<ArrowLine, "title"> & { deals: { title: string } | null };
  type Spend = { id: string; cost: number; created_at: string; rewards: { title: string } | null };
  const lines: ArrowLine[] = (gains.data as unknown as Gain[]).map(({ deals, ...g }) => ({
    ...g,
    id: `g${g.id}`,
    title: deals?.title ?? null,
  }));
  // Sans la migration 017 : pas encore d'échanges.
  for (const s of (spends.data ?? []) as unknown as Spend[]) {
    lines.push({
      id: `s${s.id}`,
      deal_id: null,
      kind: "spend",
      amount: -s.cost,
      multiplier: 1,
      paid: true,
      created_at: s.created_at,
      title: s.rewards?.title ?? null,
    });
  }
  return lines.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Résultat d'un vote renvoyé par `react_to_deal`. */
export interface ArrowOutcome {
  /** "noloc" : position non partagée ; "far" : à plus de 500 m d'une offre placée */
  status: "paid" | "pending" | "noloc" | "far" | "limit" | "already";
  kind: "confirm" | "report";
  amount: number;
  multiplier: number;
  archived: boolean;
}

export interface ArrowNotice {
  title: string;
  detail?: string;
  /** La position vient d'être partagée : le message rappelle comment elle est protégée. */
  secure?: boolean;
}

const NEEDS_POSITION = "Sans ta position (Profil, « Ma localisation »), pas de Flèches sur une offre placée.";
const TOO_FAR = `Tu es à plus de ${NEARBY_M} m de l'offre.`;

export function outcomeNotice(o: ArrowOutcome): ArrowNotice | null {
  const detail = (first: string) => [first, o.multiplier > 1 && "série : gains × 1,5"].filter(Boolean).join(" · ");
  switch (o.status) {
    case "paid":
      return {
        title: `+${o.amount} Flèches`,
        detail: detail(o.kind === "confirm" ? "Offre confirmée" : "Signalement corroboré, offre archivée"),
      };
    case "pending":
      return {
        title: "Signalement enregistré",
        detail: detail(`+${o.amount} Flèches quand 3 étudiants l'auront signalée`),
      };
    case "noloc":
      return { title: "Réaction enregistrée, sans Flèches", detail: NEEDS_POSITION };
    case "far":
      return { title: "Réaction enregistrée, sans Flèches", detail: TOO_FAR };
    case "limit":
      return {
        title: "Réaction enregistrée, sans Flèches",
        detail: `Tes ${DAILY_PAID_VOTES} votes récompensés du jour sont atteints.`,
      };
    default:
      return null;
  }
}

// ---------- Prévenir l'interface (solde affiché, message de gain) ----------
const EVENT = "sharewood:arrows";

/** Le solde a pu changer ; `notice` affiche en plus un message. */
export function announce(notice: ArrowNotice | null = null) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: notice }));
}

export function onArrows(listener: (notice: ArrowNotice | null) => void) {
  const handle = (e: Event) => listener((e as CustomEvent<ArrowNotice | null>).detail);
  window.addEventListener(EVENT, handle);
  return () => window.removeEventListener(EVENT, handle);
}

const LIMIT_REACHED = `Tes ${DAILY_PAID_CREATIONS} publications récompensées du jour sont atteintes.`;

function creationNotice(amount: number, multiplier: number, refusal: string): ArrowNotice {
  return amount === 0
    ? { title: "Bon plan publié, sans Flèches", detail: refusal }
    : { title: `+${amount} Flèches`, detail: `Bon plan partagé${multiplier > 1 ? " · série : gains × 1,5" : ""}` };
}

/** Annonce les Flèches de la dernière publication, déjà décidées par la base. */
async function announceCreation() {
  const created = (await fetchMyArrows())?.history.find((e) => e.kind === "create");
  const recent = created && Date.now() - new Date(created.created_at).getTime() < 120_000;
  announce(recent ? creationNotice(created.amount, created.multiplier, LIMIT_REACHED) : null);
}

/**
 * Après une publication. Lieu précis : la position est demandée et la base vérifie qu'on est sur place
 * avant de verser les Flèches (migration 020 ; sans elle, l'ancien barème s'applique).
 */
export async function rewardCreation(dealId: string, placed: boolean) {
  if (!placed) return announceCreation();
  const position = await currentPosition();
  const { data, error } = await getSupabase().rpc("claim_creation_arrows", {
    p_deal_id: dealId,
    p_lat: position?.lat ?? null,
    p_lng: position?.lng ?? null,
  });
  if (error) {
    if (error.code === "PGRST202") return announceCreation();
    console.warn("Flèches de publication non vérifiées :", error.message);
    return announce();
  }
  // null : rien à gagner (compte commerçant, par exemple).
  if (!data) return announce();
  const claim = data as { status: "paid" | "noloc" | "far" | "limit"; amount: number; multiplier: number };
  const refusal = { paid: "", noloc: NEEDS_POSITION, far: TOO_FAR, limit: LIMIT_REACHED }[claim.status];
  announce({ ...creationNotice(claim.amount, claim.multiplier, refusal), secure: !!position });
}
