"use client";

// Onglet « Recherche ». Carte : Justin · Fil, filtres et « Pour toi » : Sacha
import Link from "next/link";
import { useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";
import DealCard from "@/components/feed/DealCard";
import { TargetIcon } from "@/components/icons";
import DealsMap from "@/components/map/DealsMapLoader";
import { APP_NAME, CATEGORIES } from "@/lib/constants";
import { hotScore } from "@/lib/hot";
import { rankDeals, toStudentProfile, type Match } from "@/lib/matching";
import { isBoosted } from "@/lib/merchant";
import type { Deal, DealCategory, DealWithVotes } from "@/lib/types";
import { useDeals } from "@/lib/useDeals";
import { useFavorites } from "@/lib/useFavorites";
import { usePreferences } from "@/lib/usePreferences";

/** Filtre « qui a publié » : les offres des commerçants sont les offres officielles. */
const AUTHORS = { all: "Tous", merchant: "Commerçants", student: "Étudiants" } as const;
type AuthorFilter = keyof typeof AUTHORS;
const byAuthor = (deal: Deal, a: AuthorFilter) => a === "all" || deal.is_official === (a === "merchant");

export default function Page() {
  const { deals, loading, error, loadedAt } = useDeals();
  const { profile, preferences, loading: loadingProfile, error: profileError } = usePreferences();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [chosenTab, setTab] = useState<"forYou" | "all" | null>(null);
  const [category, setCategory] = useState<DealCategory | null>(null);
  const [author, setAuthor] = useState<AuthorFilter>("all");

  const me = profile?.onboarded ? toStudentProfile(profile, preferences) : null;
  const tab = me ? (chosenTab ?? "forYou") : "all";
  const ranked: { deal: DealWithVotes; match?: Match }[] = me
    ? rankDeals(deals, me)
    : deals.map((deal) => ({ deal }));
  const forYouCount = ranked.filter((r) => r.match?.forYou).length;

  // « Tout » est trié par « Hot » (réactions, vitesse, fraîcheur : lib/hot.ts) ; « Pour toi » par compatibilité.
  const hot = new Map(deals.map((d) => [d.id, hotScore(d, d.votes ?? [], loadedAt)]));
  const inTab =
    tab === "forYou"
      ? ranked.filter((r) => r.match?.forYou)
      : [...ranked].sort(
          (a, b) =>
            (hot.get(b.deal.id) ?? 0) - (hot.get(a.deal.id) ?? 0) ||
            b.deal.created_at.localeCompare(a.deal.created_at),
        );
  const filtered = inTab.filter((r) => (!category || r.deal.category === category) && byAuthor(r.deal, author));
  // Offres mises en avant en tête (sans les ajouter à « Pour toi » si elles ne correspondent pas).
  const shown = [...filtered].sort((a, b) => Number(isBoosted(b.deal)) - Number(isBoosted(a.deal)));
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

  /** Aucun bon plan « Pour toi » avec ces filtres : on passe sur « Tout » pour ne pas montrer un écran vide. */
  const nothingForMe = (c: DealCategory | null, a: AuthorFilter) =>
    !ranked.some((r) => r.match?.forYou && (!c || r.deal.category === c) && byAuthor(r.deal, a));
  function chooseCategory(c: DealCategory | null) {
    setCategory(c);
    if (tab === "forYou" && (c || author !== "all") && nothingForMe(c, author)) setTab("all");
  }
  function chooseAuthor(a: AuthorFilter) {
    setAuthor(a);
    if (tab === "forYou" && (category || a !== "all") && nothingForMe(category, a)) setTab("all");
  }
  function chooseTab(t: "forYou" | "all") {
    setTab(t);
    if (t === "forYou" && (category || author !== "all") && nothingForMe(category, author)) {
      setCategory(null);
      setAuthor("all");
    }
  }

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

      <div className="px-4 py-3">
        <h1 className="text-sm font-medium text-[var(--color-muted)]">
          {profile?.username ? `Bonjour ${profile.username}` : "Les bons plans étudiants"}
        </h1>
        {profile && !profile.onboarded && (
          <Link href="/onboarding" className="mt-2 block rounded-lg px-4 py-3" style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}>
            <span className="block font-medium">Personnalise tes bons plans</span>
            <span className="block text-sm" style={{ color: "var(--color-sage)" }}>
              1 minute pour voir ce qui correspond à ta zone, ton budget et tes envies.
            </span>
          </Link>
        )}
        {profileError && <p className="mt-2 text-sm text-red-600">{profileError}</p>}
      </div>

      {me && (
        <div className="mx-4 grid grid-cols-2 rounded-full p-1 text-sm font-medium" style={{ backgroundColor: "var(--color-border)" }}>
          {(["forYou", "all"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => chooseTab(t)}
              className="flex items-center justify-center gap-1.5 rounded-full py-2"
              style={tab === t ? { backgroundColor: "var(--color-surface)", color: "var(--color-forest)", boxShadow: "0 1px 3px rgb(0 0 0 / 0.1)" } : { color: "var(--color-muted)" }}
            >
              {t === "forYou" ? (
                <>
                  <TargetIcon className="h-4 w-4" /> Pour toi ({forYouCount})
                </>
              ) : (
                `Tout (${deals.length})`
              )}
            </button>
          ))}
        </div>
      )}

      <div role="group" aria-label="Publié par" className="flex gap-2 px-4 pt-3">
        {(Object.keys(AUTHORS) as AuthorFilter[]).map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={author === a}
            onClick={() => chooseAuthor(a)}
            className="flex-1 rounded-full border px-2 py-1.5 text-sm font-medium"
            style={
              author === a
                ? { borderColor: "var(--color-aubergine)", backgroundColor: "var(--color-aubergine)", color: "var(--color-surface)" }
                : { borderColor: "var(--color-border)", color: "var(--color-ink)" }
            }
          >
            {AUTHORS[a]}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
        {[null, ...categories].map((c) => (
          <button
            key={c ?? "all"}
            type="button"
            aria-pressed={category === c}
            onClick={() => chooseCategory(c)}
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
        <h2 className="text-lg">
          {tab === "forYou" ? "Sélectionnés pour toi" : "Fil des bons plans"}
        </h2>
        <p role="status" className="mt-1 text-sm text-[var(--color-muted)]">
          {error ? (
            <span className="text-red-600">Impossible de charger les bons plans : {error}</span>
          ) : busy ? (
            "Chargement des bons plans…"
          ) : shown.length > 0 ? (
            `${shown.length} bon${shown.length > 1 ? "s" : ""} plan${shown.length > 1 ? "s" : ""}, dont ${mapDeals.length} sur la carte`
          ) : tab === "forYou" ? (
            "Rien ne correspond à ton profil pour le moment : regarde l'onglet « Tout » ou élargis tes préférences."
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
