// Réactions aux bons plans (vues, passages, votes) et gestion de ses propres signalements.
import type { DealState } from "./rules";
import { announce, outcomeNotice, type ArrowOutcome } from "./arrows";
import { currentPosition } from "./location";
import type { Point } from "./geo";
import { removeDealPhoto } from "./photos";
import { getSupabase, isSupabaseConfigured } from "./supabase/client";
import { fetchDealTrust } from "./trust";
import type { Deal, DealAudience, DealTrust, Vote } from "./types";
import { normalizeDeal } from "./legacy";

type DbError = { code?: string; message: string };

function check<T>(result: { data: T; error: DbError | null }): T {
  const { error } = result;
  if (!error) return result.data;
  // Table ou fonction absente : la migration n'a pas encore été lancée sur la base.
  if (["PGRST205", "PGRST202", "42P01"].includes(error.code ?? "")) {
    throw new Error("La base de données n'est pas à jour : lancer supabase/migrations/007_engagement.sql.");
  }
  throw new Error(error.message);
}

export async function currentUserId() {
  const {
    data: { session },
  } = await getSupabase().auth.getSession();
  return session?.user.id ?? null;
}

/** Fiche ouverte : compte une seule vue par étudiant (jamais l'auteur). Sans effet en cas d'erreur. */
export async function recordView(deal: Pick<Deal, "id" | "author_id">) {
  if (!isSupabaseConfigured) return;
  const userId = await currentUserId();
  if (!userId || userId === deal.author_id) return;
  await getSupabase()
    .from("deal_views")
    .upsert({ deal_id: deal.id, user_id: userId }, { onConflict: "deal_id,user_id", ignoreDuplicates: true });
}

export interface Engagement {
  userId: string;
  votes: Vote[];
  /** null tant que la migration 007 n'est pas lancée : le bouton « J'en ai profité » est masqué. */
  visit: { mine: boolean; count: number } | null;
  /** Masses pondérées par le poids des étudiants (migration 014), null → calcul local. */
  trust: DealTrust | null;
  /** Douteuse, retirée… (tenu par la base) ; null si l'offre n'a pas pu être relue. */
  state: DealState | null;
}

/** `*` : les colonnes d'état n'existent qu'après les migrations 016 et 023. */
async function fetchDealState(dealId: string) {
  const { data } = await getSupabase().from("deals").select("*").eq("id", dealId).maybeSingle();
  return data as DealState | null;
}

export async function fetchEngagement(dealId: string): Promise<Engagement> {
  const supabase = getSupabase();
  const userId = await currentUserId();
  if (!userId) throw new Error("Session expirée : reconnecte-toi.");
  const [votes, mine, count, trust, state] = await Promise.all([
    supabase.from("votes").select("*").eq("deal_id", dealId),
    supabase.from("deal_visits").select("deal_id").eq("deal_id", dealId).eq("user_id", userId),
    supabase.rpc("deal_visit_count", { p_deal_id: dealId }),
    fetchDealTrust([dealId]),
    fetchDealState(dealId),
  ]);
  return {
    state,
    userId,
    votes: check(votes) as Vote[],
    visit: mine.error || count.error ? null : { mine: (mine.data ?? []).length > 0, count: Number(count.data) },
    trust: trust ? (trust.get(dealId) ?? { pos: 0, neg: 0 }) : null,
  };
}

/** Réactions d'une offre et leurs masses pondérées, relues après un clic sur la carte ou dans la fiche. */
export interface Reactions {
  votes: Vote[];
  trust: DealTrust | null;
  state: DealState | null;
}

export async function fetchReactions(dealId: string): Promise<Reactions> {
  const [votes, trust, state] = await Promise.all([
    getSupabase().from("votes").select("*").eq("deal_id", dealId),
    fetchDealTrust([dealId]),
    fetchDealState(dealId),
  ]);
  return { state, votes: check(votes) as Vote[], trust: trust ? (trust.get(dealId) ?? { pos: 0, neg: 0 }) : null };
}

/**
 * Un vote par étudiant et par bon plan ; revoter (même valeur comprise) le rafraîchit.
 * La position, facultative, permet de gagner des Flèches sur une offre placée (à 500 m au plus).
 */
export async function vote(dealId: string, value: 1 | -1, position: Point | null = null) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("react_to_deal", {
    p_deal_id: dealId,
    p_value: value,
    p_lat: position?.lat ?? null,
    p_lng: position?.lng ?? null,
  });
  if (!error) {
    const notice = data ? outcomeNotice(data as ArrowOutcome) : null;
    // Position partagée : le message le rappelle, même sans gain.
    return announce(position ? { ...(notice ?? { title: "Réaction enregistrée" }), secure: true } : notice);
  }
  // Sans la migration 016 (fonction absente) : vote simple, sans Flèches.
  if (error.code !== "PGRST202") throw new Error(error.message);
  check(await supabase.from("votes").upsert({ deal_id: dealId, value }, { onConflict: "deal_id,user_id" }));
}

/** Retire son vote (migration 013). */
export async function removeVote(dealId: string, userId: string) {
  const { error } = await getSupabase().from("votes").delete().eq("deal_id", dealId).eq("user_id", userId);
  if (error) {
    throw new Error(
      /permission/i.test(error.message)
        ? "La base de données n'est pas à jour : lancer supabase/migrations/013_unvote.sql."
        : error.message,
    );
  }
  announce();
}

export type Reaction = "visited" | "gone" | null;

/**
 * Réaction d'un étudiant (tâche 29) : « J'en ai profité » = passage + confirmation (vote +1),
 * « Plus dispo » = vote -1. Les deux s'excluent ; null retire tout.
 * `visitsAvailable` : false tant que la migration 007 manque (on ne touche alors qu'aux votes).
 * `placed` : offre située sur la carte, la position est alors demandée pour les Flèches.
 */
export async function setReaction(
  dealId: string,
  userId: string,
  reaction: Reaction,
  current: { vote?: 1 | -1; visited: boolean; visitsAvailable: boolean; placed?: boolean },
) {
  if (reaction) {
    const position = current.placed ? await currentPosition() : null;
    await vote(dealId, reaction === "visited" ? 1 : -1, position);
  } else if (current.vote !== undefined) await removeVote(dealId, userId);

  if (!current.visitsAvailable) return;
  const visited = reaction === "visited";
  if (visited !== current.visited) await setVisited(dealId, userId, visited);
}

export async function setVisited(dealId: string, userId: string, visited: boolean) {
  const table = getSupabase().from("deal_visits");
  check(
    visited
      ? // Déjà déclaré (ancien « J'en ai profité » sans vote) : rien à faire.
        await table.upsert({ deal_id: dealId, user_id: userId }, { onConflict: "deal_id,user_id", ignoreDuplicates: true })
      : await table.delete().eq("deal_id", dealId).eq("user_id", userId),
  );
}

// ---------- Mes bons plans ----------
export async function fetchMyDeals() {
  const supabase = getSupabase();
  const userId = await currentUserId();
  if (!userId) throw new Error("Session expirée : reconnecte-toi.");
  const [deals, audience] = await Promise.all([
    supabase.from("deals").select("*").eq("author_id", userId).order("created_at", { ascending: false }),
    supabase.rpc("my_deal_audience"),
  ]);
  let stats: Record<string, DealAudience> | null = null;
  let statsError: string | null = null;
  try {
    stats = Object.fromEntries((check(audience) as DealAudience[]).map((a) => [a.deal_id, a]));
  } catch (e) {
    // Sans les chiffres, la liste reste utilisable.
    statsError = (e as Error).message;
  }
  return { userId, deals: (check(deals) as Deal[]).map(normalizeDeal), stats, statsError, fetchedAt: Date.now() };
}

export type MyDealInput = Pick<Deal, "title" | "description" | "expires_at" | "requirements" | "link_url">;

export async function updateMyDeal(dealId: string, input: MyDealInput) {
  check(await getSupabase().from("deals").update(input).eq("id", dealId));
}

export async function setMyDealEnded(dealId: string, ended: boolean) {
  check(await getSupabase().from("deals").update({ ended_by_merchant: ended }).eq("id", dealId));
}

export async function deleteMyDeal(dealId: string) {
  // `*` : la colonne photo_url n'existe qu'après la migration 008.
  const { data } = await getSupabase().from("deals").select("*").eq("id", dealId).maybeSingle();
  check(await getSupabase().from("deals").delete().eq("id", dealId));
  const photo = (data as Deal | null)?.photo_url;
  if (photo) await removeDealPhoto(photo);
  announce(); // les Flèches de cette offre sont retirées
}
