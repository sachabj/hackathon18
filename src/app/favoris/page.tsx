"use client";

import ArrowBadge from "@/components/arrows/ArrowBadge";
import { useEffect, useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";
import DealCard from "@/components/feed/DealCard";
import { ChevronDownIcon } from "@/components/icons";
import { APP_NAME, CATEGORIES } from "@/lib/constants";
import { normalizeDeal } from "@/lib/legacy";
import { withTrust } from "@/lib/trust";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Deal, DealCategory, DealWithVotes } from "@/lib/types";
import { useFavorites } from "@/lib/useFavorites";

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

export default function Page() {
  const { favoriteIds, loading: loadingFavorites, toggleFavorite } = useFavorites();
  const [deals, setDeals] = useState<DealWithVotes[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
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
      }
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
      <header
        className="sticky top-0 z-10 -mx-4 flex items-center gap-2 px-4 py-3 backdrop-blur"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-surface) 95%, transparent)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- petit logo statique, SVG */}
        <img src="/logo.svg" alt="" width={28} height={28} className="shrink-0" aria-hidden />
        <p className="text-xl" style={{ color: "var(--color-ink)" }}>{APP_NAME}</p>
        <ArrowBadge className="ml-auto" />
      </header>

      <h1 className="mt-3 text-sm font-medium text-[var(--color-muted)]">Mes favoris</h1>

      <p role="status" className="mt-2 text-sm text-[var(--color-muted)]">
        {error ? (
          <span className="text-red-600">Impossible de charger les favoris : {error}</span>
        ) : busy ? (
          "Chargement…"
        ) : total === 0 ? (
          "Aucun favori pour l'instant : touche le cœur sur un bon plan pour l'ajouter ici."
        ) : (
          `${total} favori${total > 1 ? "s" : ""}`
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
                  <span className="flex-1 text-sm font-medium" style={{ color: "var(--color-ink)" }}>{CATEGORIES[category].label}</span>
                  <span className="text-xs text-[var(--color-muted)]">{deals.length}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-[var(--color-muted)] transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                  />
                </button>
                {!isCollapsed && (
                  <ul id={panelId} className="space-y-3 p-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                    {deals.map((deal) => (
                      <li key={deal.id}>
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
