// Compte : sécurité, données personnelles, suppression. Responsable : Sacha.
import { removeMyPhotos } from "./photos";
import { getSupabase } from "./supabase/client";

type DbError = { code?: string; message: string };

async function currentUser() {
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  if (!user?.email) throw new Error("Session expirée : reconnecte-toi.");
  return { ...user, email: user.email };
}

export async function fetchAccountInfo() {
  const supabase = getSupabase();
  const user = await currentUser();
  const [profile, preferences] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    // `*` et maybeSingle : un commerçant n'a pas de préférences.
    supabase.from("preferences").select("*").eq("user_id", user.id).maybeSingle(),
  ]);
  if (profile.error) throw new Error(profile.error.message);
  return {
    userId: user.id,
    email: user.email,
    username: (profile.data.username as string | null) ?? "",
    acceptedAt: (profile.data.privacy_accepted_at as string | null | undefined) ?? null,
    hasPosition: preferences.data?.lat != null,
    isMerchant: profile.data.role === "merchant",
  };
}

export async function updateUsername(userId: string, username: string) {
  const { error } = await getSupabase().from("profiles").update({ username }).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function forgetPosition(userId: string) {
  const { error } = await getSupabase().from("preferences").update({ lat: null, lng: null }).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

/** Vérifie le mot de passe actuel (nouvelle connexion) avant une action sensible. */
async function checkPassword(password: string) {
  const { email } = await currentUser();
  const { error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (!error) return;
  throw new Error(error.code === "invalid_credentials" ? "Mot de passe actuel incorrect." : error.message);
}

/** Change le mot de passe puis déconnecte les autres appareils. */
export async function changePassword(current: string, next: string) {
  await checkPassword(current);
  const { auth } = getSupabase();
  const { error } = await auth.updateUser({ password: next });
  if (error) {
    throw new Error(
      error.code === "same_password" ? "Le nouveau mot de passe doit être différent de l'ancien." : error.message,
    );
  }
  const others = await auth.signOut({ scope: "others" });
  if (others.error) {
    throw new Error(`Mot de passe changé, mais les autres appareils restent connectés : ${others.error.message}`);
  }
}

export async function signOutEverywhere() {
  const { error } = await getSupabase().auth.signOut({ scope: "global" });
  if (error) throw new Error(error.message);
}

/** Toutes les données rattachées au compte (droit d'accès et à la portabilité). */
export async function exportMyData() {
  const supabase = getSupabase();
  const user = await currentUser();
  const tables = [
    ["profile", "profiles", "id"],
    ["preferences", "preferences", "user_id"],
    ["deals", "deals", "author_id"],
    ["votes", "votes", "user_id"],
    ["favorites", "favorites", "user_id"],
    ["views", "deal_views", "user_id"],
    ["visits", "deal_visits", "user_id"],
    ["business", "businesses", "owner_id"],
    ["arrows", "arrow_events", "user_id"],
    ["activity_days", "activity_days", "user_id"],
    ["rewards", "user_rewards", "user_id"],
    ["directions", "deal_directions", "user_id"],
    ["shared_links_opened", "deal_shares", "viewer_id"],
    ["referral_code", "referral_codes", "user_id"],
    ["friends_referred", "referrals", "referrer_id"],
    ["referred_by", "referrals", "referee_id"],
    ["support_messages", "support_messages", "user_id"],
  ] as const;
  const results = await Promise.all(
    tables.map(([, table, column]) => supabase.from(table).select("*").eq(column, user.id)),
  );
  const data: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    account: { email: user.email, created_at: user.created_at, metadata: user.user_metadata },
  };
  tables.forEach(([key, table], i) => {
    const { data: rows, error } = results[i];
    // Table pas encore créée (migration non lancée) : aucune donnée à exporter.
    const missing = error && ["PGRST205", "42P01"].includes((error as DbError).code ?? "");
    if (error && !missing) throw new Error(`Export incomplet (${table}) : ${error.message}`);
    data[key] = rows ?? [];
  });
  return data;
}

async function keptDeals() {
  const { data, error } = await getSupabase().rpc("my_kept_deals");
  if (error) {
    throw new Error(
      error.code === "PGRST202"
        ? "La base de données n'est pas à jour : lancer supabase/migrations/009_account.sql."
        : error.message,
    );
  }
  return data as { deal_id: string; photo_url: string | null }[];
}

/** Ce que deviendront les bons plans si le compte est supprimé. */
export async function previewDeletion() {
  const user = await currentUser();
  const [kept, mine] = await Promise.all([
    keptDeals(),
    getSupabase().from("deals").select("id").eq("author_id", user.id),
  ]);
  if (mine.error) throw new Error(mine.error.message);
  return { kept: kept.length, deleted: Math.max(0, mine.data.length - kept.length) };
}

export async function deleteAccount(password: string) {
  await checkPassword(password);
  const user = await currentUser();
  // Avant tout effacement : échoue ici si la migration manque.
  const kept = await keptDeals();
  // Les fichiers d'abord : une fois le compte supprimé, on n'a plus le droit de les effacer.
  await removeMyPhotos(user.id, kept.flatMap((k) => k.photo_url ?? []));
  const { error } = await getSupabase().rpc("delete_my_account");
  if (error) throw new Error(error.message);
  await getSupabase().auth.signOut({ scope: "local" });
}
