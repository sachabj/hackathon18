// Lecture et écriture des préférences : `profiles` (catégories, zones) + `preferences` (privé).
import type { StudentProfile } from "./matching";
import { getSupabase } from "./supabase/client";
import type { Preferences, Profile } from "./types";

export async function fetchMyPreferences() {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Session expirée : reconnecte-toi.");

  const [profile, preferences] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("preferences").select("*").eq("user_id", user.id).maybeSingle(),
  ]);
  if (profile.error) throw new Error(readableError(profile.error));
  if (preferences.error) throw new Error(readableError(preferences.error));
  return { profile: profile.data as Profile, preferences: preferences.data as Preferences | null };
}

export async function saveMyPreferences(userId: string, me: StudentProfile) {
  const supabase = getSupabase();
  const privatePart = await supabase.from("preferences").upsert({
    user_id: userId,
    home_zone_id: me.homeZoneId,
    lat: me.position?.lat ?? null,
    lng: me.position?.lng ?? null,
    transport_modes: me.transportModes,
    budget_profile: me.budget,
    activities: me.activities,
    updated_at: new Date().toISOString(),
  });
  if (privatePart.error) throw new Error(readableError(privatePart.error));

  const publicPart = await supabase
    .from("profiles")
    .update({ followed_categories: me.categories, followed_zone_ids: me.zoneIds, onboarded: true })
    .eq("id", userId);
  if (publicPart.error) throw new Error(readableError(publicPart.error));
}

function readableError(error: { code?: string; message: string }) {
  // Table absente : la migration n'a pas encore été lancée sur la base.
  if (error.code === "PGRST205" || error.code === "42P01") {
    return "La base de données n'est pas à jour : lancer supabase/migrations/004_preferences.sql.";
  }
  return error.message;
}
