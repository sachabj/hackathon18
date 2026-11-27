"use client";

import { useEffect, useState } from "react";
import DealCard from "@/components/feed/DealCard";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Deal } from "@/lib/types";
import { useFavorites } from "@/lib/useFavorites";

export default function Page() {
  const { favoriteIds, loading: loadingFavorites, toggleFavorite } = useFavorites();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || loadingFavorites) return;
    let cancelled = false;

    async function load() {
      if (favoriteIds.size === 0) {
        if (!cancelled) {
          setDeals([]);
          setLoading(false);
        }
        return;
      }
      const supabase = getSupabase();
      const { data, error } = await supabase.from("deals").select("*").in("id", [...favoriteIds]);
      if (cancelled) return;
      if (error) setError(error.message);
      else setDeals((data ?? []) as Deal[]);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [favoriteIds, loadingFavorites]);

  // Échéance la plus proche d'abord (date limite, puis fin d'offre), le reste à la fin.
  const sorted = [...deals].sort((a, b) => {
    const da = a.deadline_at ?? a.expires_at;
    const db = b.deadline_at ?? b.expires_at;
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da.localeCompare(db);
  });

  const busy = loadingFavorites || loading;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <h1 className="text-2xl font-bold">Mes favoris ❤️</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Les bons plans que tu as mis de côté pour y revenir plus tard.
      </p>

      <p role="status" className="mt-4 text-sm text-zinc-500">
        {error ? (
          <span className="text-red-600">Impossible de charger les favoris : {error}</span>
        ) : busy ? (
          "Chargement…"
        ) : sorted.length === 0 ? (
          "Aucun favori pour l'instant : touche 🤍 sur un bon plan pour l'ajouter ici."
        ) : (
          `${sorted.length} favori${sorted.length > 1 ? "s" : ""}`
        )}
      </p>

      {!busy && sorted.length > 0 && (
        <ul className="mt-3 space-y-3">
          {sorted.map((deal) => (
            <li key={deal.id}>
              <DealCard deal={deal} favorite onToggleFavorite={toggleFavorite} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
