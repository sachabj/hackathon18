"use client";

// Accueil : les offres rangées en onglets (« Pour toi » et les rubriques).
// La barre de recherche est sur la page Recherche (carte + toutes les offres).
import ArrowBadge from "@/components/arrows/ArrowBadge";
import Link from "next/link";
import { useState } from "react";
import DealCard from "@/components/feed/DealCard";
import Tabs from "@/components/Tabs";
import { APP_NAME } from "@/lib/constants";
import { rankDeals, toStudentProfile, type Match } from "@/lib/matching";
import { isBoosted } from "@/lib/merchant";
import type { DealCategory, DealWithVotes } from "@/lib/types";
import { useDeals } from "@/lib/useDeals";
import { useFavorites } from "@/lib/useFavorites";
import { usePreferences } from "@/lib/usePreferences";

/** Rubriques déduites de la catégorie : chaque catégorie appartient à une seule rubrique. */
const SECTIONS = [
  { id: "travel", label: "Voyager", categories: ["transport"] },
  { id: "aids", label: "Aides & bourses", categories: ["scholarship"] },
  { id: "culture", label: "Culture & sport", categories: ["sport", "activity"] },
  { id: "daily", label: "Quotidien", categories: ["restaurant", "supermarket"] },
] as const satisfies readonly { id: string; label: string; categories: readonly DealCategory[] }[];

type TabId = "forYou" | (typeof SECTIONS)[number]["id"];

type Item = { deal: DealWithVotes; match?: Match };

/** Offres mises en avant en tête, sans changer l'ordre du reste. */
const boostedFirst = (items: Item[]) =>
  [...items].sort((a, b) => Number(isBoosted(b.deal)) - Number(isBoosted(a.deal)));

export default function Page() {
  const { deals, loading, error } = useDeals();
  const { profile, preferences, loading: loadingProfile, error: profileError } = usePreferences();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [tab, setTab] = useState<TabId>("forYou");

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

  const tabs: { id: TabId; label: string; items: Item[] }[] = [
    { id: "forYou", label: "Pour toi", items: forYouItems },
    ...SECTIONS.map((s) => ({
      id: s.id,
      label: s.label,
      items: boostedFirst(ranked.filter((r) => (s.categories as readonly DealCategory[]).includes(r.deal.category))),
    })),
  ];

  const current = tabs.find((t) => t.id === tab)!;
  const busy = loading || loadingProfile;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col">
      <header
        className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 backdrop-blur"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-surface) 95%, transparent)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- petit logo statique, SVG */}
        <img src="/logo.svg" alt="" width={28} height={28} className="shrink-0" aria-hidden />
        <p className="text-xl" style={{ color: "var(--color-ink)" }}>{APP_NAME}</p>
        <ArrowBadge className="ml-auto" />
      </header>

      <div className="space-y-4 px-4 py-4">
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
          <Tabs label="Rubriques" idPrefix="tab" tabs={tabs} selected={tab} onSelect={setTab} />

          <div id="tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-3 pt-3">
            {busy ? (
              <p className="text-sm text-[var(--color-muted)]">Chargement des bons plans…</p>
            ) : (
              !error && (
                <>
                  {tab === "forYou" && forYou.length === 0 && deals.length > 0 && (
                    <p className="text-sm text-[var(--color-muted)]">
                      {me
                        ? "Rien ne correspond encore à ton profil : voici les derniers bons plans."
                        : "Voici les derniers bons plans."}
                    </p>
                  )}
                  {current.items.length === 0 ? (
                    <p className="text-sm text-[var(--color-muted)]">Aucun bon plan dans cette rubrique pour le moment.</p>
                  ) : (
                    <ul className="space-y-3">
                      {current.items.map(({ deal, match }) => (
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
