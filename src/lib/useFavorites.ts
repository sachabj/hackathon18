"use client";

import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase/client";

/** Favoris de l'utilisateur connecté (table `favorites`), avec ajout/retrait optimiste. */
export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    async function load() {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("favorites").select("deal_id");
      if (cancelled) return;
      if (error) setError(error.message);
      else setFavoriteIds(new Set((data ?? []).map((f) => f.deal_id as string)));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleFavorite(dealId: string) {
    const wasFavorite = favoriteIds.has(dealId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorite) next.delete(dealId);
      else next.add(dealId);
      return next;
    });

    const supabase = getSupabase();
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    const { error } = wasFavorite
      ? await supabase.from("favorites").delete().eq("deal_id", dealId)
      : await supabase.from("favorites").insert({ deal_id: dealId, user_id: userId });

    if (error) {
      // Retour en arrière si l'écriture échoue.
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.add(dealId);
        else next.delete(dealId);
        return next;
      });
      setError(error.message);
    }
  }

  return {
    favoriteIds,
    loading,
    error,
    isFavorite: (dealId: string) => favoriteIds.has(dealId),
    toggleFavorite,
  };
}
