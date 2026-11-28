"use client";

// Doublons sans IA à la publication (tâche 27). Responsable : Matteo.
//  - lieu précis : offres déjà partagées au même établissement (même nom de lieu) ;
//  - zone / partout : offres de même catégorie, même portée et même zone.
// Lecture avec les droits de l'utilisateur (RLS) : seules les offres qu'il peut voir remontent.
import { settleDoubtfulDeals } from "./engagement";
import { getSupabase } from "./supabase/client";
import type { Deal, DealCategory, DealScope } from "./types";

export interface ExistingDeal {
  id: string;
  title: string;
  price_info: string | null;
  description: string | null;
  place_name: string | null;
  /** Bon plan publié par l'utilisateur lui-même : pas de vote possible dessus. */
  mine: boolean;
}

// `*` : la colonne archived_at n'existe qu'après la migration 016.
const COLUMNS = "*";

async function toExisting(rows: Deal[] | null): Promise<ExistingDeal[]> {
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  const now = Date.now();
  return (rows ?? [])
    .filter((d) => !d.ended_by_merchant && !d.archived_at && !(d.expires_at && new Date(d.expires_at).getTime() < now))
    .map((d) => ({
      id: d.id,
      title: d.title,
      price_info: d.price_info,
      description: d.description,
      place_name: d.place_name,
      mine: Boolean(user && d.author_id === user.id),
    }));
}

/** Offres encore valables enregistrées au même établissement (nom de lieu identique). */
export async function dealsAtPlace(placeName: string): Promise<ExistingDeal[]> {
  await settleDoubtfulDeals();
  const { data, error } = await getSupabase()
    .from("deals")
    .select(COLUMNS)
    .eq("place_name", placeName)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return toExisting(data as Deal[]);
}

/** Offres « sur une zone » ou « partout » de même catégorie (et même zone), encore valables. */
export async function similarAreaDeals(draft: {
  category: DealCategory;
  scope: Exclude<DealScope, "local">;
  zone_id: string | null;
}): Promise<ExistingDeal[]> {
  await settleDoubtfulDeals();
  let query = getSupabase().from("deals").select(COLUMNS).eq("category", draft.category).eq("scope", draft.scope);
  if (draft.scope === "zone" && draft.zone_id) query = query.eq("zone_id", draft.zone_id);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(20);
  if (error) throw new Error(error.message);
  return toExisting(data as Deal[]);
}
