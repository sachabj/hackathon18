"use client";

import { useEffect, useState } from "react";
import DealCard from "@/components/feed/DealCard";
import { APP_NAME, CATEGORIES } from "@/lib/constants";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Deal, DealCategory } from "@/lib/types";
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
  const byDeadline = (a: Deal, b: Deal) => {
    const da = a.deadline_at ?? a.expires_at;
    const db = b.deadline_at ?? b.expires_at;
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da.localeCompare(db);
  };

  // Regroupés par catégorie (ordre de `CATEGORIES`) pour se repérer quand on a beaucoup de favoris.
  const groups = (Object.keys(CATEGORIES) as DealCategory[])
    .map((category) => ({
      category,
      deals: deals.filter((d) => d.category === category).sort(byDeadline),
    }))
    .filter((g) => g.deals.length > 0);

  const busy = loadingFavorites || loading;
  const total = deals.length;

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-6">
      <header className="sticky top-0 z-10 -mx-4 flex items-center gap-2 border-b border-zinc-100 bg-white/95 px-4 py-3 backdrop-blur">
        <span className="text-2xl" aria-hidden>
          🪵
        </span>
        <p className="text-2xl font-extrabold tracking-tight text-blue-600">{APP_NAME}</p>
      </header>

      <h1 className="mt-3 text-sm font-medium text-zinc-500">Mes favoris ❤️</h1>

      <p role="status" className="mt-2 text-sm text-zinc-500">
        {error ? (
          <span className="text-red-600">Impossible de charger les favoris : {error}</span>
        ) : busy ? (
          "Chargement…"
        ) : total === 0 ? (
          "Aucun favori pour l'instant : touche 🤍 sur un bon plan pour l'ajouter ici."
        ) : (
          `${total} favori${total > 1 ? "s" : ""}`
        )}
      </p>

      {!busy && groups.length > 0 && (
        <div className="mt-3 space-y-5">
          {groups.map(({ category, deals }) => (
            <section key={category}>
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-zinc-700">
                <span aria-hidden>{CATEGORIES[category].emoji}</span>
                {CATEGORIES[category].label}
                <span className="font-normal text-zinc-400">({deals.length})</span>
              </h2>
              <ul className="space-y-3">
                {deals.map((deal) => (
                  <li key={deal.id}>
                    <DealCard deal={deal} favorite onToggleFavorite={toggleFavorite} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
