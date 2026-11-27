"use client";

// Accueil : barre de recherche, puis les offres rangées en onglets (« Pour toi » et les rubriques).
// Pendant une recherche, une seule liste de résultats remplace les onglets.
import ArrowBadge from "@/components/arrows/ArrowBadge";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import DealCard from "@/components/feed/DealCard";
import SearchFilters from "@/components/feed/SearchFilters";
import Tabs from "@/components/Tabs";
import { CloseIcon, SearchIcon } from "@/components/icons";
import { APP_NAME, ZONES } from "@/lib/constants";
import { rankDeals, toStudentProfile, type Match } from "@/lib/matching";
import { isBoosted } from "@/lib/merchant";
import { queryWords, searchDeals } from "@/lib/search";
import {
  applyFilters,
  dealDistance,
  defaultFilters,
  readIntents,
  travelLabel,
  type SearchFilters as Filters,
} from "@/lib/searchFilters";
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
  const searchInput = useRef<HTMLInputElement>(null);
  /** Filtres choisis à la main : ils l'emportent sur ceux déduits de la saisie. */
  const [chosen, setChosen] = useState<Partial<Filters>>({});

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

  // « pizza pas cher » : « pizza » est cherché, « pas cher » active le filtre de prix.
  const intents = readIntents(query);
  const defaults = defaultFilters(me?.transportModes ?? []);
  const filters: Filters = { ...defaults, ...intents.filters, ...chosen };
  // Point de départ des trajets : la position enregistrée, sinon le centre de la zone principale.
  const homeZone = ZONES.find((z) => z.id === me?.homeZoneId);
  const origin = me?.position ?? homeZone ?? null;
  const filtering =
    filters.price !== "any" ||
    filters.requirement !== "any" ||
    (origin !== null && filters.maxMinutes !== null) ||
    (filters.sort !== "relevance" && (origin !== null || filters.sort !== "distance"));

  /** Quand le trajet compte, la carte affiche la durée avec le moyen choisi. */
  const withTravel = (items: Item[]) =>
    items.map((item) => {
      const km = filters.maxMinutes !== null || filters.sort === "distance" ? dealDistance(item.deal, origin) : null;
      return km === null || !item.match
        ? item
        : { ...item, match: { ...item.match, distance: travelLabel(km, filters.mode) } };
    });

  // La recherche porte sur toutes les offres ; à pertinence égale, les plus compatibles d'abord.
  const matched = searching ? searchDeals(ranked, intents.text) : null;
  const results = matched && {
    exact: withTravel(applyFilters(matched.exact, filters, origin)),
    close: withTravel(applyFilters(matched.close, filters, origin)),
  };
  const found = results ? results.exact.length + results.close.length : 0;
  const hidden = matched ? matched.exact.length + matched.close.length - found : 0;
  const busy = loading || loadingProfile;

  /** Les résultats s'affichent déjà pendant la saisie : valider ferme le clavier pour les voir. */
  function submitSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (searching) searchInput.current?.blur();
    else searchInput.current?.focus();
  }

  function changeQuery(value: string) {
    setQuery(value);
    // Champ vidé : la prochaine recherche repart sans filtre.
    if (value === "") return setChosen({});
    // Une nouvelle expression (« gratuit »…) l'emporte sur un choix manuel antérieur du même filtre.
    const before = readIntents(query).filters;
    const after = readIntents(value).filters;
    const renewed = (Object.keys(after) as (keyof Filters)[]).filter((k) => after[k] !== before[k]);
    if (renewed.length > 0) {
      setChosen((c) => Object.fromEntries(Object.entries(c).filter(([k]) => !renewed.includes(k as keyof Filters))));
    }
  }

  /** La croix annule la recherche : on retrouve les onglets, clavier fermé. */
  function cancelSearch() {
    changeQuery("");
    searchInput.current?.blur();
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
        <ArrowBadge className="ml-auto" />
      </header>

      <div className="space-y-4 px-4 py-4">
        {/* Pas de formule d'accueil (« Bonjour … ») : la page commence par la recherche. Titre pour les lecteurs d'écran. */}
        <h1 className="sr-only">Les bons plans étudiants</h1>
        {profile && !profile.onboarded && (
          <Link href="/onboarding" className="block rounded-lg px-4 py-3" style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}>
            <span className="block font-medium">Personnalise tes bons plans</span>
            <span className="block text-sm" style={{ color: "var(--color-sage)" }}>
              1 minute pour voir ce qui correspond à ta zone, ton budget et tes envies.
            </span>
          </Link>
        )}

        {/* `action` : sans formulaire avec cet attribut, le clavier iPhone n'affiche pas la touche « Rechercher ». */}
        <form role="search" action="/" onSubmit={submitSearch} className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-forest)]" />
            <input
              ref={searchInput}
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder="Un bon plan, un lieu…"
              aria-label="Rechercher un bon plan"
              // La croix native (absente de certains navigateurs) est remplacée par la nôtre.
              className="sw-field h-full [&::-webkit-search-cancel-button]:appearance-none"
              style={{ paddingLeft: "2.75rem", paddingRight: query ? "2.5rem" : undefined }}
            />
            {query && (
              <button
                type="button"
                onClick={cancelSearch}
                aria-label="Annuler la recherche"
                title="Annuler la recherche"
                className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-[var(--color-muted)]"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Coins identiques à ceux du champ (`.sw-btn-primary` l'emporte sur les classes Tailwind). */}
          <button type="submit" className="sw-btn-primary shrink-0 text-sm" style={{ borderRadius: 14, padding: "0 0.9rem" }}>
            Rechercher
          </button>
        </form>

        {profileError && <p className="text-sm text-red-600">{profileError}</p>}
        {error && <p className="text-sm text-red-600">Impossible de charger les bons plans : {error}</p>}
        {busy && <p className="text-sm text-[var(--color-muted)]">Chargement des bons plans…</p>}

        {results ? (
          !busy &&
          !error && (
            <section aria-label="Résultats de la recherche" className="space-y-3">
              <SearchFilters
                filters={filters}
                hasOrigin={origin !== null}
                originLabel={me?.position ? "ta position enregistrée" : `le centre de ${homeZone?.name}`}
                profileHref={me ? "/onboarding?etape=zone" : "/onboarding"}
                onChange={(patch) => setChosen((c) => ({ ...c, ...patch }))}
                // Tout remettre à zéro, y compris les filtres venus de la saisie.
                onReset={filtering ? () => setChosen(defaults) : undefined}
              />
              <p role="status" className="text-sm text-[var(--color-muted)]">
                {found === 0 && hidden > 0
                  ? `Aucun résultat avec ces filtres (${hidden} sans eux).`
                  : results.exact.length > 0
                    ? `${results.exact.length} résultat${results.exact.length > 1 ? "s" : ""} pour « ${query.trim()} »`
                    : found > 0
                      ? matched!.exact.length > 0
                        ? "Avec ces filtres, il ne reste que des résultats proches."
                        : `Rien ne contient exactement « ${query.trim()} ».`
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
            <Tabs label="Rubriques" idPrefix="tab" tabs={tabs} selected={tab} onSelect={setTab} />

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
