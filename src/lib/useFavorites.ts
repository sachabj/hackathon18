"use client";

import { useEffect, useState } from "react";
import { announce } from "./arrows";
import { getSupabase, isSupabaseConfigured } from "./supabase/client";
import { tr } from "./i18n";

const RETRY = "Vérifie ta connexion puis réessaie.";

// Un cœur touché quelque part (fil, carte, fiche) : toutes les listes et tous les cœurs affichés suivent.
const EVENT = "sharewood:favorite";
type FavoriteChange = { dealId: string; favorite: boolean };
const announceFavorite = (change: FavoriteChange) => window.dispatchEvent(new CustomEvent(EVENT, { detail: change }));

/** Favoris de l'utilisateur connecté (table `favorites`), avec ajout/retrait optimiste. */
export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(isSupabaseConfigured);
  /** Erreur de lecture ; une erreur d'enregistrement est annoncée par un message. */
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    async function load() {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("favorites").select("deal_id");
      if (cancelled) return;
      if (error) {
        setError(error.message);
        announce({ title: tr("Favoris indisponibles"), detail: tr(RETRY), error: true });
      } else setFavoriteIds(new Set((data ?? []).map((f) => f.deal_id as string)));
      setLoading(false);
    }

    load();
    const onChange = (e: Event) => {
      const { dealId, favorite } = (e as CustomEvent<FavoriteChange>).detail;
      setFavoriteIds((prev) => {
        if (prev.has(dealId) === favorite) return prev;
        const next = new Set(prev);
        if (favorite) next.add(dealId);
        else next.delete(dealId);
        return next;
      });
    };
    window.addEventListener(EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, onChange);
    };
  }, []);

  async function toggleFavorite(dealId: string) {
    const wasFavorite = favoriteIds.has(dealId);
    announceFavorite({ dealId, favorite: !wasFavorite });

    const supabase = getSupabase();
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    const { error } = wasFavorite
      ? await supabase.from("favorites").delete().eq("deal_id", dealId)
      : await supabase.from("favorites").insert({ deal_id: dealId, user_id: userId });

    if (error) {
      // Retour en arrière si l'écriture échoue (partout).
      announceFavorite({ dealId, favorite: wasFavorite });
      announce({ title: tr("Favori non enregistré"), detail: tr(RETRY), error: true });
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
