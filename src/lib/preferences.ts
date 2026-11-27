// Lecture et écriture des préférences : `profiles` (catégories, zones) + `preferences` (privé).
import { isTraveler, type StudentProfile } from "./matching";
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
  const base = {
    user_id: userId,
    home_zone_id: me.homeZoneId,
    lat: me.position?.lat ?? null,
    lng: me.position?.lng ?? null,
    transport_modes: me.transportModes,
    budget_profile: me.budget,
    activities: me.activities,
    updated_at: new Date().toISOString(),
  };
  const travel = {
    home_visits: me.homeVisits,
    wants_travel: null,
    travel_modes: isTraveler(me) ? me.travelModes : [],
  };
  const aids = { is_scholarship: me.isScholar, has_carte_sortir: me.hasCarteSortir };
  let privatePart = await supabase.from("preferences").upsert({ ...base, ...travel, ...aids });
  // Colonnes absentes (migration 010 pas encore lancée) : on enregistre au moins le reste.
  if (privatePart.error?.code === "PGRST204") {
    console.warn("Réponses « aides » non enregistrées : lancer supabase/migrations/010_student_aids.sql.");
    privatePart = await supabase.from("preferences").upsert({ ...base, ...travel });
  }
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
