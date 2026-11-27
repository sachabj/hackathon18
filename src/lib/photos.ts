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

/** Efface la photo d'un bon plan supprimé (seules les siennes sont effaçables). Sans effet en cas d'erreur. */
export async function removeDealPhoto(url: string) {
  const path = url.split(`/object/public/${BUCKET}/`)[1];
  if (!path) return;
  const { error } = await getSupabase().storage.from(BUCKET).remove([path]);
  if (error) console.warn("Photo non effacée :", error.message);
}

/** Efface toutes les photos de l'utilisateur, sauf celles des liens à garder (suppression de compte). */
export async function removeMyPhotos(userId: string, keepUrls: string[]) {
  const bucket = getSupabase().storage.from(BUCKET);
  const { data, error } = await bucket.list(userId, { limit: 1000 });
  if (error) {
    // Stockage jamais créé (migration 008 non lancée) : il n'y a aucune photo.
    if (/bucket not found/i.test(error.message)) return;
    throw new Error(`Photos non effacées : ${error.message}`);
  }
  const keep = new Set(keepUrls.map((u) => u.split("/").pop()));
  const paths = data.filter((f) => !keep.has(f.name)).map((f) => `${userId}/${f.name}`);
  if (paths.length === 0) return;
  const removed = await bucket.remove(paths);
  if (removed.error) throw new Error(`Photos non effacées : ${removed.error.message}`);
}

/** N'affiche que les photos de notre propre stockage (jamais une image externe arbitraire). */
export const isOwnPhotoUrl = (url: string | null | undefined): url is string =>
  Boolean(url && supabaseUrl && url.startsWith(`${supabaseUrl}/storage/v1/object/public/${BUCKET}/`));
