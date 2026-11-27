"use client";

// Accueil : barre de recherche, puis les offres rangées en onglets (« Pour toi » et les rubriques).
// Pendant une recherche, une seule liste de résultats remplace les onglets.
import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import DealCard from "@/components/feed/DealCard";
import { SearchIcon } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { rankDeals, toStudentProfile, type Match } from "@/lib/matching";
import { isBoosted } from "@/lib/merchant";
import { queryWords, searchDeals } from "@/lib/search";
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
  const [query, setQuery] = useState("");

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
  const searching = queryWords(query).length > 0;
  // La recherche porte sur toutes les offres ; à pertinence égale, les plus compatibles d'abord.
  const results = searching ? searchDeals(ranked, query) : null;
  const found = results ? results.exact.length + results.close.length : 0;
  const busy = loading || loadingProfile;

  /** Au clavier : flèches, Début et Fin passent d'un onglet à l'autre. */
  function moveTab(e: KeyboardEvent<HTMLDivElement>) {
    const i = tabs.findIndex((t) => t.id === tab);
    const keys: Record<string, number> = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = (keys[e.key] + tabs.length) % tabs.length;
    setTab(tabs[next].id);
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next].focus();
  }

  const list = (items: Item[]) => (
    <ul className="space-y-3">
      {items.map(({ deal, match }) => (
        <li key={deal.id}>
          <DealCard deal={deal} match={match} favorite={isFavorite(deal.id)} onToggleFavorite={toggleFavorite} />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col">
      <header
        className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 backdrop-blur"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-surface) 95%, transparent)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- petit logo statique, SVG */}
        <img src="/logo.svg" alt="" width={28} height={28} className="shrink-0" aria-hidden />
        <p className="text-xl" style={{ color: "var(--color-ink)" }}>{APP_NAME}</p>
      </header>

      <div className="space-y-4 px-4 py-4">
        <h1 className="text-2xl">{profile?.username ? `Bonjour ${profile.username}` : "Les bons plans étudiants"}</h1>
        {profile && !profile.onboarded && (
          <Link href="/onboarding" className="block rounded-lg px-4 py-3" style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}>
            <span className="block font-medium">Personnalise tes bons plans</span>
            <span className="block text-sm" style={{ color: "var(--color-sage)" }}>
              1 minute pour voir ce qui correspond à ta zone, ton budget et tes envies.
            </span>
          </Link>
        )}

        <div role="search" className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-forest)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un bon plan"
            aria-label="Rechercher un bon plan"
            className="sw-field"
            style={{ paddingLeft: "2.75rem" }}
          />
        </div>

        {profileError && <p className="text-sm text-red-600">{profileError}</p>}
        {error && <p className="text-sm text-red-600">Impossible de charger les bons plans : {error}</p>}
        {busy && <p className="text-sm text-[var(--color-muted)]">Chargement des bons plans…</p>}

        {results ? (
          !busy &&
          !error && (
            <section aria-label="Résultats de la recherche" className="space-y-3">
              <p role="status" className="text-sm text-[var(--color-muted)]">
                {results.exact.length > 0
                  ? `${results.exact.length} résultat${results.exact.length > 1 ? "s" : ""} pour « ${query.trim()} »`
                  : found > 0
                    ? `Rien ne contient exactement « ${query.trim()} ».`
                    : `Aucun bon plan ne correspond à « ${query.trim()} ».`}
              </p>
              {results.exact.length > 0 && list(results.exact)}
              {results.close.length > 0 && (
                <>
                  <h2 className="pt-1 text-lg">Résultats proches</h2>
                  {list(results.close)}
                </>
              )}
            </section>
          )
        ) : (
          <div>
            <div
              role="tablist"
              aria-label="Rubriques"
              onKeyDown={moveTab}
              className="grid grid-cols-5 border-b-2"
              style={{ borderColor: "var(--color-forest)" }}
            >
              {tabs.map((t) => {
                const selected = tab === t.id;
                return (
                  <button
                    key={t.id}
                    id={`tab-${t.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="tab-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setTab(t.id)}
                    className="flex min-h-14 items-center justify-center rounded-t border border-b-0 px-0.5 py-1.5 text-center text-[11px] font-medium leading-tight min-[360px]:text-xs"
                    style={
                      selected
                        ? { borderColor: "var(--color-forest)", backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }
                        : { borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-ink)" }
                    }
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div id="tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-3 pt-3">
              {!busy && !error && (
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
                    list(current.items)
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
