"use client";

import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase/client";

export type Role = "student" | "merchant";

async function fetchRole(): Promise<Role> {
  const supabase = getSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return "student";
  // Inscrit comme commerçant mais commerce pas encore créé : déjà l'interface commerçant.
  if (session.user.user_metadata?.account_type === "merchant") return "merchant";
  const { data } = await supabase.rpc("is_merchant");
  return data === true ? "merchant" : "student";
}

/**
 * Type de compte, qui choisit l'interface affichée (null tant qu'on ne sait pas).
 * Revérifié quand `key` change (ex. : la page courante). Les droits, eux, sont garantis par la base.
 */
export function useRole(key: string): Role | null {
  const [role, setRole] = useState<Role | null>(isSupabaseConfigured ? null : "student");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchRole()
      .catch((): Role => "student")
      .then((r) => !cancelled && setRole(r));
    return () => {
      cancelled = true;
    };
  }, [key]);

  return role;
}
