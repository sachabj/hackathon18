"use client";

import { useEffect, useState } from "react";
import { fetchMyPreferences } from "./preferences";
import { isSupabaseConfigured } from "./supabase/client";

type Data = Awaited<ReturnType<typeof fetchMyPreferences>>;

/** Profil + préférences de l'utilisateur connecté, relus à chaque retour sur la page. */
export function usePreferences() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchMyPreferences()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { profile: data?.profile ?? null, preferences: data?.preferences ?? null, loading, error };
}
