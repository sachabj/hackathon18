import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** false tant que .env.local n'est pas rempli : l'app affiche alors un bandeau au lieu de planter. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | undefined;

/**
 * Client Supabase côté navigateur (à utiliser dans les composants "use client").
 * Les droits sont garantis par les policies RLS de supabase/schema.sql.
 */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase non configuré : remplir .env.local (voir .env.example)");
  }
  client ??= createBrowserClient(supabaseUrl!, supabaseAnonKey!);
  return client;
}
