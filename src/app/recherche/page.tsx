"use client";

// Onglet « Recherche ». Carte : Justin · Recherche, filtres et tri Hot : Sacha / Matteo
// La recherche (déplacée depuis l'Accueil) remplace le fil « Hot » par ses résultats ; la carte,
// elle, montre toujours toutes les offres localisées et se centre sur celle qu'on touche dans une liste.
import ArrowBadge from "@/components/arrows/ArrowBadge";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import DealCard from "@/components/feed/DealCard";
import SearchFilters from "@/components/feed/SearchFilters";
import DealsMap from "@/components/map/DealsMapLoader";
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
import type { DealWithVotes } from "@/lib/types";
import { useCascade } from "@/lib/motion";
import { useDeals } from "@/lib/useDeals";
import { useFavorites } from "@/lib/useFavorites";
import { usePreferences } from "@/lib/usePreferences";

type Item = { deal: DealWithVotes; match?: Match };

export default function Page() {
  const { deals, loading, error, hot } = useDeals();
  const { profile, preferences, loading: loadingProfile, error: profileError } = usePreferences();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  /** Filtres choisis à la main : ils l'emportent sur ceux déduits de la saisie. */
  const [chosen, setChosen] = useState<Partial<Filters>>({});
  /** Offre touchée dans une liste : la carte s'y centre et la met en avant. */
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const me = profile?.onboarded ? toStudentProfile(profile, preferences) : null;
  const ranked: Item[] = me ? rankDeals(deals, me) : deals.map((deal) => ({ deal }));

  // Toutes les offres, triées par « Hot » (réactions, vitesse, fraîcheur : lib/hot.ts), celles mises en avant en tête.
  const shown = [...ranked].sort(
    (a, b) =>
      Number(isBoosted(b.deal)) - Number(isBoosted(a.deal)) ||
      (hot.get(b.deal.id) ?? 0) - (hot.get(a.deal.id) ?? 0) ||
      b.deal.created_at.localeCompare(a.deal.created_at),
  );
  // La carte montre toujours toutes les offres localisées, pour comparer les distances en cliquant dans une liste.
  const mapDeals = shown.map((r) => r.deal).filter((d) => d.scope === "local");

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
  const hiddenCount = matched ? matched.exact.length + matched.close.length - found : 0;
  const busy = loading || loadingProfile;
  // Tâche 75 : cartes en cascade au chargement, en passant du fil à la recherche et à chaque changement de filtre.
  const cascade = useCascade<HTMLElement>(`${busy}|${query.trim() === ""}|${JSON.stringify(chosen)}`);

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

  /** La croix annule la recherche : on retrouve le fil « Hot », clavier fermé. */
  function cancelSearch() {
    changeQuery("");
    searchInput.current?.blur();
  }

  const list = (items: Item[]) => (
    <ul className="space-y-3">
      {items.map(({ deal, match }) => (
        <li key={deal.id} data-cascade>
          <DealCard
            deal={deal}
            match={match}
            favorite={isFavorite(deal.id)}
            onToggleFavorite={toggleFavorite}
            onSelect={setSelectedId}
            selected={deal.id === selectedId}
          />
        </li>
      ))}
    </ul>
  );

  // Ordinateur : recherche et liste à gauche (qui défile), carte sur toute la hauteur à droite.
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col lg:grid lg:h-[calc(100dvh-4rem)] lg:max-w-none lg:grid-cols-[28rem_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]">
      <header
        className="sticky top-0 z-[1001] flex items-center gap-2 px-4 py-3 backdrop-blur lg:hidden"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-surface) 95%, transparent)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- petit logo statique, SVG */}
        <img src="/logo.svg" alt="" width={28} height={28} className="shrink-0" aria-hidden />
        <p className="text-xl" style={{ color: "var(--color-ink)" }}>{APP_NAME}</p>
        <ArrowBadge className="ml-auto" />
      </header>

      {/* Pas de formule d'accueil (« Bonjour … ») ; titre pour les lecteurs d'écran. */}
      <h1 className="sr-only">Carte et recherche des bons plans</h1>

      <div className="px-4 py-3 lg:col-start-1 lg:row-start-1">
        {profile && !profile.onboarded && (
          <Link
            href="/onboarding"
            className="mb-3 block rounded-lg px-4 py-3"
            style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}
          >
            <span className="block font-medium">Personnalise tes bons plans</span>
            <span className="block text-sm" style={{ color: "var(--color-sage)" }}>
              1 minute pour voir ce qui correspond à ta zone, ton budget et tes envies.
            </span>
          </Link>
        )}

        {/* `action` : sans formulaire avec cet attribut, le clavier iPhone n'affiche pas la touche « Rechercher ». */}
        <form role="search" action="/recherche" onSubmit={submitSearch} className="flex gap-2">
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

        {profileError && <p className="mt-2 text-sm text-red-600">{profileError}</p>}
      </div>

      <div className="h-[40dvh] min-h-64 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-auto lg:min-h-0">
        <DealsMap deals={mapDeals} homeZoneId={me?.homeZoneId} savedPosition={me?.position} selectedId={selectedId} />
      </div>

      <section ref={cascade} className="px-4 py-4 lg:relative lg:col-start-1 lg:row-start-2 lg:overflow-y-auto lg:pt-1">
        {error && <p className="text-sm text-red-600">Impossible de charger les bons plans : {error}</p>}
        {!error &&
          (results ? (
            !busy && (
              <div className="space-y-3">
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
                  {found === 0 && hiddenCount > 0
                    ? `Aucun résultat avec ces filtres (${hiddenCount} sans eux).`
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
              </div>
            )
          ) : (
            <>
              <h2 className="text-lg">Fil des bons plans</h2>
              <p role="status" className="mt-1 text-sm text-[var(--color-muted)]">
                {busy
                  ? "Chargement des bons plans…"
                  : shown.length > 0
                    ? `${shown.length} bon${shown.length > 1 ? "s" : ""} plan${shown.length > 1 ? "s" : ""}, dont ${mapDeals.length} sur la carte`
                    : "Aucun bon plan pour le moment."}
              </p>
              {!busy && (
                <div className="mt-3">
                  {shown.length === 0 ? null : list(shown)}
                </div>
              )}
            </>
          ))}
      </section>
    </div>
  );
}
