"use client";

// Accueil : les offres et une rangée de filtres (tâche 67) : « Pour toi » ou « Mes favoris », et une ou plusieurs
// catégories. La barre de recherche est sur la page Recherche (carte + toutes les offres).
import ArrowBadge from "@/components/arrows/ArrowBadge";
import Link from "next/link";
import { useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";
import DealCard from "@/components/feed/DealCard";
import { HeartIcon, TargetIcon } from "@/components/icons";
import { APP_NAME, CATEGORIES } from "@/lib/constants";
import { rankDeals, toStudentProfile, type Match } from "@/lib/matching";
import { isBoosted } from "@/lib/merchant";
import type { DealCategory, DealWithVotes } from "@/lib/types";
import { useDeals } from "@/lib/useDeals";
import { useFavorites } from "@/lib/useFavorites";
import { usePreferences } from "@/lib/usePreferences";

/** Filtre principal : « Pour toi », « Mes favoris », ou aucun (toutes les offres). */
type Scope = "forYou" | "favorites" | null;

/** Toutes les catégories, dans l'ordre de `CATEGORIES`. */
const CATEGORY_IDS = Object.keys(CATEGORIES) as DealCategory[];

/** Échéance la plus proche d'abord (date limite, puis fin de l'offre) ; sans date à la fin. */
const deadlineOf = (deal: DealWithVotes) => {
  const d = deal.deadline_at ?? deal.expires_at;
  return d ? new Date(d).getTime() : Number.MAX_SAFE_INTEGER;
};

type Item = { deal: DealWithVotes; match?: Match };

/** Offres mises en avant en tête, sans changer l'ordre du reste. */
const boostedFirst = (items: Item[]) =>
  [...items].sort((a, b) => Number(isBoosted(b.deal)) - Number(isBoosted(a.deal)));

export default function Page() {
  const { deals, loading, error } = useDeals();
  const { profile, preferences, loading: loadingProfile, error: profileError } = usePreferences();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [scope, setScope] = useState<Scope>("forYou");
  const [categories, setCategories] = useState<DealCategory[]>([]);

  const me = profile?.onboarded ? toStudentProfile(profile, preferences) : null;
  // Avec un profil : les plus compatibles d'abord. Sans : les plus récentes.
  const ranked: Item[] = me ? rankDeals(deals, me) : deals.map((deal) => ({ deal }));
  const forYou = ranked.filter((r) => r.match?.forYou);
  const matchById = new Map(ranked.map((r) => [r.deal.id, r.match]));
  // Rien de compatible (ou pas de profil) : « Pour toi » montre les plus récentes plutôt qu'un écran vide.
  const forYouItems =
    forYou.length > 0
      ? boostedFirst(forYou)
      : deals.map((deal) => ({ deal, match: matchById.get(deal.id) }));

  // Base selon le filtre principal, puis restriction aux catégories choisies (aucune = toutes).
  const base: Item[] =
    scope === "forYou"
      ? forYouItems
      : scope === "favorites"
        ? ranked.filter((r) => isFavorite(r.deal.id)).sort((a, b) => deadlineOf(a.deal) - deadlineOf(b.deal))
        : boostedFirst(ranked);
  const items = categories.length > 0 ? base.filter((r) => categories.includes(r.deal.category)) : base;
  const toggleCategory = (c: DealCategory) =>
    setCategories((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]));
  const emptyMessage =
    scope === "favorites"
      ? categories.length > 0
        ? "Aucun favori dans ces catégories."
        : "Touche le cœur d'une offre pour la retrouver ici."
      : "Aucun bon plan dans ces catégories pour le moment.";
  const busy = loading || loadingProfile;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col md:max-w-3xl lg:max-w-6xl lg:pb-8">
      <header
        className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 backdrop-blur lg:hidden"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-surface) 95%, transparent)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- petit logo statique, SVG */}
        <img src="/logo.svg" alt="" width={28} height={28} className="shrink-0" aria-hidden />
        <p className="text-xl" style={{ color: "var(--color-ink)" }}>{APP_NAME}</p>
        <ArrowBadge className="ml-auto" />
      </header>

      <div className="space-y-4 px-4 py-4 lg:py-6">
        {/* Pas de formule d'accueil (« Bonjour … ») : la page commence par les onglets. Titre pour les lecteurs d'écran. */}
        <h1 className="sr-only">Les bons plans étudiants</h1>
        {profile && !profile.onboarded && (
          <Link href="/onboarding" className="block rounded-lg px-4 py-3" style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}>
            <span className="block font-medium">Personnalise tes bons plans</span>
            <span className="block text-sm" style={{ color: "var(--color-sage)" }}>
              1 minute pour voir ce qui correspond à ta zone, ton budget et tes envies.
            </span>
          </Link>
        )}

        {profileError && <p className="text-sm text-red-600">{profileError}</p>}
        {error && <p className="text-sm text-red-600">Impossible de charger les bons plans : {error}</p>}

        <div>
          {/* Filtres : un filtre principal (Pour toi / Mes favoris, retouché = désactivé) et des catégories cumulables. */}
          <div
            role="group"
            aria-label="Filtres"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:justify-center lg:px-0"
          >
            <FilterChip selected={scope === "forYou"} onClick={() => setScope(scope === "forYou" ? null : "forYou")}>
              <TargetIcon className="h-4 w-4" /> Pour toi
            </FilterChip>
            <FilterChip selected={scope === "favorites"} onClick={() => setScope(scope === "favorites" ? null : "favorites")}>
              <HeartIcon className="h-4 w-4" filled={scope === "favorites"} /> Mes favoris
            </FilterChip>
            <span aria-hidden className="w-px shrink-0 self-stretch" style={{ backgroundColor: "var(--color-border)" }} />
            {CATEGORY_IDS.map((c) => (
              <FilterChip key={c} selected={categories.includes(c)} onClick={() => toggleCategory(c)}>
                <span aria-hidden><CategoryIcon category={c} size={20} /></span> {CATEGORIES[c].label}
              </FilterChip>
            ))}
          </div>

          <div role="region" aria-label="Bons plans" className="space-y-3 pt-3">
            {busy ? (
              <p className="text-sm text-[var(--color-muted)]">Chargement des bons plans…</p>
            ) : (
              !error && (
                <>
                  {scope === "forYou" && forYou.length === 0 && deals.length > 0 && (
                    <p className="text-sm text-[var(--color-muted)]">
                      {me
                        ? "Rien ne correspond encore à ton profil : voici les derniers bons plans."
                        : "Voici les derniers bons plans."}
                    </p>
                  )}
                  {items.length === 0 ? (
                    <p className="text-sm text-[var(--color-muted)]">{emptyMessage}</p>
                  ) : (
                    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 [&>li>article]:h-full">
                      {items.map(({ deal, match }) => (
                        <li key={deal.id}>
                          <DealCard deal={deal} match={match} favorite={isFavorite(deal.id)} onToggleFavorite={toggleFavorite} />
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Puce de filtre : remplie quand elle est active. */
function FilterChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition active:scale-95"
      style={
        selected
          ? { borderColor: "var(--color-forest)", backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }
          : { borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-ink)" }
      }
    >
      {children}
    </button>
  );
}
