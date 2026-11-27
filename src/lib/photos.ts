"use client";

// Photo de preuve d'un bon plan : dépôt dans le stockage public `deal-photos` (migration 008).
// Responsable : Matteo.
import { getSupabase, supabaseUrl } from "./supabase/client";

const BUCKET = "deal-photos";

/** Dépose une photo JPEG (base64) dans le dossier de l'utilisateur et renvoie son lien public. */
export async function uploadDealPhoto(base64Jpeg: string): Promise<string> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Connexion requise.");
  const bytes = Uint8Array.from(atob(base64Jpeg), (c) => c.charCodeAt(0));
  const path = `${user.id}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Blob([bytes], { type: "image/jpeg" }), { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** N'affiche que les photos de notre propre stockage (jamais une image externe arbitraire). */
export const isOwnPhotoUrl = (url: string | null | undefined): url is string =>
  Boolean(url && supabaseUrl && url.startsWith(`${supabaseUrl}/storage/v1/object/public/${BUCKET}/`));
