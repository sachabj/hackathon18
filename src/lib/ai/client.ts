"use client";

// Côté navigateur : appels à /api/assist, compression de la photo, bons plans proches à comparer.
import { distanceKm } from "@/lib/geo";
import { getSupabase } from "@/lib/supabase/client";
import type { Deal, DealCategory, DealScope } from "@/lib/types";
import type { AssistDraft, AssistRequest, AssistResponse, AssistReview, DuplicateCandidate, ReviewInput } from "./types";

export class AssistUnavailable extends Error {}

async function call<T>(body: AssistRequest): Promise<T> {
  let res: Response;
  try {
    res = await fetch("/api/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AssistUnavailable("Assistant injoignable (réseau).");
  }
  const json = (await res.json().catch(() => null)) as AssistResponse<T> | null;
  if (!json) throw new AssistUnavailable("Assistant indisponible.");
  if (!json.ok) throw json.unavailable ? new AssistUnavailable(json.error) : new Error(json.error);
  return json.result;
}

export const extractFromInput = (input: { text?: string; image?: { media_type: "image/jpeg"; data: string } }) =>
  call<AssistDraft>({ action: "extract", ...input });

export const reviewBeforePublish = (draft: ReviewInput, candidates: DuplicateCandidate[]) =>
  call<AssistReview>({ action: "review", draft, candidates });

/** Photo redimensionnée (1568 px max, taille idéale pour Claude) et compressée en JPEG, en base64. */
export async function photoToJpeg(file: File): Promise<{ media_type: "image/jpeg"; data: string; preview: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1568 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const preview = canvas.toDataURL("image/jpeg", 0.85);
  return { media_type: "image/jpeg", data: preview.slice(preview.indexOf(",") + 1), preview };
}

/**
 * Bons plans récents qui pourraient être le même : même catégorie et, pour un lieu précis, à moins de 300 m
 * (sinon même portée et même zone). Lus avec les droits de l'utilisateur (RLS).
 */
export async function findDuplicateCandidates(draft: {
  category: DealCategory;
  scope: DealScope;
  zone_id: string | null;
  lat: number | null;
  lng: number | null;
}): Promise<DuplicateCandidate[]> {
  const since = new Date(Date.now() - 60 * 24 * 3600_000).toISOString();
  const { data, error } = await getSupabase()
    .from("deals")
    .select("id, title, category, scope, zone_id, place_name, lat, lng, price_info, description, expires_at, ended_by_merchant")
    .eq("category", draft.category)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  const now = Date.now();
  return (data as Deal[])
    .filter((d) => !d.ended_by_merchant && !(d.expires_at && new Date(d.expires_at).getTime() < now))
    .filter((d) => {
      if (draft.scope === "local") {
        return d.lat != null && d.lng != null && draft.lat != null && draft.lng != null
          ? distanceKm({ lat: d.lat, lng: d.lng }, { lat: draft.lat, lng: draft.lng }) <= 0.3
          : false;
      }
      return d.scope === draft.scope && d.zone_id === draft.zone_id;
    })
    .slice(0, 15)
    .map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      place_name: d.place_name,
      zone_id: d.zone_id,
      price_info: d.price_info,
      description: d.description,
    }));
}
