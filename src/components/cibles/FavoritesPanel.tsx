"use client";

// Favoris regroupés par catégorie (Anne-Lise) : onglet de la page « Ciblés ».

import { useEffect, useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";
import DealCard from "@/components/feed/DealCard";
import { ChevronDownIcon } from "@/components/icons";
import { CATEGORIES } from "@/lib/constants";
import { applyReactions, onReactions } from "@/lib/engagement";
import { normalizeDeal } from "@/lib/legacy";
import { useCascade } from "@/lib/motion";
import { isDealHidden } from "@/lib/rules";
import { withTrust } from "@/lib/trust";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Deal, DealCategory, DealWithVotes } from "@/lib/types";
import { useFavorites } from "@/lib/useFavorites";
import { useT } from "@/lib/i18n";

const COLLAPSED_KEY = "sharewood:favoris:collapsed";

function readCollapsed(): Set<DealCategory> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(COLLAPSED_KEY);
    return new Set(raw ? (JSON.parse(raw) as DealCategory[]) : []);
  } catch {
    return new Set();
  }
}

export default function FavoritesPanel() {
  const { favoriteIds, loading: loadingFavorites, error: favoritesError, toggleFavorite } = useFavorites();
  const t = useT();
  const [deals, setDeals] = useState<DealWithVotes[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [loadError, setError] = useState<string | null>(null);
  const error = favoritesError ?? loadError;
  /** Instant du chargement : référence pour dire quels favoris sont terminés. */
  const [loadedAt, setLoadedAt] = useState(0);

  // Réaction faite ici ou dans une fiche : la liste la reprend aussitôt.
  useEffect(() => onReactions((change) => setDeals((list) => applyReactions(list, change))), []);
  const [collapsed, setCollapsed] = useState<Set<DealCategory>>(() => new Set());

  // Lu après le montage (localStorage n'existe pas côté serveur) : évite un décalage d'hydratation.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchro avec localStorage, pas d'alternative sans effet
    setCollapsed(readCollapsed());
  }, []);

  function toggleCollapsed(category: DealCategory) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
      return next;
    });
  }

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
      const { data, error } = await supabase.from("deals").select("*, votes(*)").in("id", [...favoriteIds]);
      if (cancelled) return;
      if (error) setError(error.message);
      else {
        const rows = await withTrust((data ?? []) as DealWithVotes[]);
        if (cancelled) return;
        setDeals(rows.map(normalizeDeal));
        setLoadedAt(Date.now());
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [favoriteIds, loadingFavorites]);

  const ended = (d: DealWithVotes) => Number(isDealHidden(d, d.votes ?? [], loadedAt));

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
      // Les offres terminées restent visibles, en bas de leur catégorie.
      deals: deals.filter((d) => d.category === category).sort((a, b) => ended(a) - ended(b) || byDeadline(a, b)),
    }))
    .filter((g) => g.deals.length > 0);

  const busy = loadingFavorites || loading;
  // Tâche 75 : cartes en cascade à l'arrivée.
  const cascade = useCascade<HTMLDivElement>(String(busy));
  const total = deals.length;

  return (
    <div ref={cascade}>
      <p role="status" className="text-sm text-[var(--color-muted)]">
        {error ? (
          <span className="text-red-600">{t("Impossible de charger les favoris :")} {error}</span>
        ) : busy ? (
          t("Chargement…")
        ) : total === 0 ? (
          t("Aucun favori pour l'instant : touche le cœur sur un bon plan pour l'ajouter ici.")
        ) : (
          t(total > 1 ? "{n} favoris" : "{n} favori", { n: total })
        )}
      </p>

      {!busy && groups.length > 0 && (
        <div className="mt-3 space-y-2">
          {groups.map(({ category, deals }) => {
            const isCollapsed = collapsed.has(category);
            const panelId = `favoris-${category}`;
            return (
              <section key={category} className="rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
                <button
                  type="button"
                  onClick={() => toggleCollapsed(category)}
                  aria-expanded={!isCollapsed}
                  aria-controls={panelId}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
                >
                  <CategoryIcon category={category} size={22} />
                  <span className="flex-1 text-sm font-medium" style={{ color: "var(--color-ink)" }}>{t(CATEGORIES[category].label)}</span>
                  <span className="text-xs text-[var(--color-muted)]">{deals.length}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-[var(--color-muted)] transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                  />
                </button>
                {!isCollapsed && (
                  <ul id={panelId} className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 [&>li>article]:h-full" style={{ borderTop: "1px solid var(--color-border)" }}>
                    {deals.map((deal) => (
                      <li key={deal.id} data-cascade>
                        <DealCard deal={deal} favorite onToggleFavorite={toggleFavorite} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
