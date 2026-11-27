"use client";

// Onglet « Recherche ». Carte : Justin · Fil et catégories : Sacha
import Link from "next/link";
import { useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";
import DealCard from "@/components/feed/DealCard";
import DealsMap from "@/components/map/DealsMapLoader";
import { APP_NAME, CATEGORIES } from "@/lib/constants";
import { hotScore } from "@/lib/hot";
import { rankDeals, toStudentProfile, type Match } from "@/lib/matching";
import { isBoosted } from "@/lib/merchant";
import type { DealCategory, DealWithVotes } from "@/lib/types";
import { useDeals } from "@/lib/useDeals";
import { useFavorites } from "@/lib/useFavorites";
import { usePreferences } from "@/lib/usePreferences";

export default function Page() {
  const { deals, loading, error, loadedAt } = useDeals();
  const { profile, preferences, loading: loadingProfile, error: profileError } = usePreferences();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [category, setCategory] = useState<DealCategory | null>(null);

  const me = profile?.onboarded ? toStudentProfile(profile, preferences) : null;
  const ranked: { deal: DealWithVotes; match?: Match }[] = me
    ? rankDeals(deals, me)
    : deals.map((deal) => ({ deal }));

  // Toutes les offres, triées par « Hot » (réactions, vitesse, fraîcheur : lib/hot.ts), celles mises en avant en tête.
  const hot = new Map(deals.map((d) => [d.id, hotScore(d, d.votes ?? [], loadedAt)]));
  const shown = ranked
    .filter((r) => !category || r.deal.category === category)
    .sort(
      (a, b) =>
        Number(isBoosted(b.deal)) - Number(isBoosted(a.deal)) ||
        (hot.get(b.deal.id) ?? 0) - (hot.get(a.deal.id) ?? 0) ||
        b.deal.created_at.localeCompare(a.deal.created_at),
    );
  const mapDeals = shown.map((r) => r.deal).filter((d) => d.scope === "local");

  // Les priorités de l'étudiant en premier.
  const categories = (Object.keys(CATEGORIES) as DealCategory[]).sort((a, b) => {
    const rank = (c: DealCategory) => {
      const i = me?.categories.indexOf(c) ?? -1;
      return i < 0 ? Infinity : i;
    };
    return rank(a) === rank(b) ? 0 : rank(a) - rank(b);
  });
  const busy = loading || loadingProfile;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      <header
        className="sticky top-0 z-[1001] flex items-center gap-2 px-4 py-3 backdrop-blur"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-surface) 95%, transparent)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- petit logo statique, SVG */}
        <img src="/logo.svg" alt="" width={28} height={28} className="shrink-0" aria-hidden />
        <p className="text-xl" style={{ color: "var(--color-ink)" }}>{APP_NAME}</p>
      </header>

      {/* Pas de formule d'accueil (« Bonjour … ») ; titre pour les lecteurs d'écran. */}
      <h1 className="sr-only">Carte des bons plans</h1>
      {/* Bloc affiché seulement s'il a quelque chose à dire (pas d'espace vide). */}
      {((profile && !profile.onboarded) || profileError) && (
        <div className="px-4 py-3">
          {profile && !profile.onboarded && (
            <Link href="/onboarding" className="block rounded-lg px-4 py-3" style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}>
              <span className="block font-medium">Personnalise tes bons plans</span>
              <span className="block text-sm" style={{ color: "var(--color-sage)" }}>
                1 minute pour voir ce qui correspond à ta zone, ton budget et tes envies.
              </span>
            </Link>
          )}
          {profileError && <p className="mt-2 text-sm text-red-600">{profileError}</p>}
        </div>
      )}

      <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
        {[null, ...categories].map((c) => (
          <button
            key={c ?? "all"}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium"
            style={
              category === c
                ? { borderColor: "var(--color-forest)", backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }
                : { borderColor: "var(--color-border)", color: "var(--color-ink)" }
            }
          >
            {c && <CategoryIcon category={c} size={18} />} {c ? CATEGORIES[c].label : "Toutes"}
          </button>
        ))}
      </div>

      <div className="h-[40dvh] min-h-64">
        <DealsMap deals={mapDeals} homeZoneId={me?.homeZoneId} savedPosition={me?.position} />
      </div>

      <section className="px-4 py-4">
        <h2 className="text-lg">Fil des bons plans</h2>
        <p role="status" className="mt-1 text-sm text-[var(--color-muted)]">
          {error ? (
            <span className="text-red-600">Impossible de charger les bons plans : {error}</span>
          ) : busy ? (
            "Chargement des bons plans…"
          ) : shown.length > 0 ? (
            `${shown.length} bon${shown.length > 1 ? "s" : ""} plan${shown.length > 1 ? "s" : ""}, dont ${mapDeals.length} sur la carte`
          ) : (
            "Aucun bon plan pour le moment."
          )}
        </p>
        {!busy && (
          <ul className="mt-3 space-y-3">
            {shown.map(({ deal, match }) => (
              <li key={deal.id}>
                <DealCard
                  deal={deal}
                  match={match}
                  favorite={isFavorite(deal.id)}
                  onToggleFavorite={toggleFavorite}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
