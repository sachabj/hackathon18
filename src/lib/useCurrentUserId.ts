"use client";

import { useEffect, useState } from "react";
import { currentUserId } from "./engagement";
import { isSupabaseConfigured } from "./supabase/client";

/** Identifiant de l'utilisateur connecté (lu dans la session locale, sans appel réseau), null avant lecture. */
export function useCurrentUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    currentUserId().then((id) => !cancelled && setUserId(id));
    return () => {
      cancelled = true;
    };
  }, []);
  return userId;
}
