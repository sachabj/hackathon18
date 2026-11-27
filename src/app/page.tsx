"use client";

// Accueil : les meilleures offres « Pour toi », l'accès à la recherche et les réductions sans lieu.
import Link from "next/link";
import { useState } from "react";
import DealCard from "@/components/feed/DealCard";
import { ArrowRightIcon, ChevronDownIcon, SearchIcon } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { rankDeals, toStudentProfile, type Match } from "@/lib/matching";
import { isBoosted } from "@/lib/merchant";
import type { DealCategory, DealWithVotes } from "@/lib/types";
import { useDeals } from "@/lib/useDeals";
import { useFavorites } from "@/lib/useFavorites";
import { usePreferences } from "@/lib/usePreferences";

const TOP_COUNT = 3;

/** Rubriques des offres sans lieu précis (sur une zone ou partout), déduites de la catégorie. */
const SECTIONS: { id: string; label: string; categories: DealCategory[] }[] = [
  { id: "travel", label: "Voyager", categories: ["transport"] },
  { id: "aids", label: "Aides & bourses", categories: ["scholarship"] },
  { id: "culture", label: "Culture & sport", categories: ["sport", "activity"] },
  { id: "daily", label: "Quotidien", categories: ["restaurant", "supermarket"] },
];

export default function Page() {
  const { deals, loading, error } = useDeals();
  const { profile, preferences, loading: loadingProfile, error: profileError } = usePreferences();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [open, setOpen] = useState<string | null>(null);

  const me = profile?.onboarded ? toStudentProfile(profile, preferences) : null;
  const ranked: { deal: DealWithVotes; match?: Match }[] = me ? rankDeals(deals, me) : deals.map((deal) => ({ deal }));
  const forYou = ranked.filter((r) => r.match?.forYou);
  // Offres mises en avant en tête, puis les plus compatibles. Sans « Pour toi » : les plus récentes.
  const top = (
    forYou.length > 0
      ? [...forYou].sort((a, b) => Number(isBoosted(b.deal)) - Number(isBoosted(a.deal)))
      : deals.map((deal) => ranked.find((r) => r.deal.id === deal.id)!)
  ).slice(0, TOP_COUNT);

  const remote = ranked.filter((r) => r.deal.scope !== "local");
  const sections = SECTIONS.map((s) => ({
    ...s,
    items: remote.filter((r) => s.categories.includes(r.deal.category)),
  })).filter((s) => s.items.length > 0);
  const busy = loading || loadingProfile;

  const card = ({ deal, match }: (typeof ranked)[number]) => (
    <li key={deal.id}>
      <DealCard deal={deal} match={match} favorite={isFavorite(deal.id)} onToggleFavorite={toggleFavorite} />
    </li>
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

      <div className="space-y-6 px-4 py-4">
        <div className="space-y-3">
          <h1 className="text-2xl">{profile?.username ? `Bonjour ${profile.username}` : "Les bons plans étudiants"}</h1>
          {profile && !profile.onboarded && (
            <Link href="/onboarding" className="block rounded-lg px-4 py-3" style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}>
              <span className="block font-medium">Personnalise tes bons plans</span>
              <span className="block text-sm" style={{ color: "var(--color-sage)" }}>
                1 minute pour voir ce qui correspond à ta zone, ton budget et tes envies.
              </span>
            </Link>
          )}
          <Link href="/recherche" className="sw-card flex items-center gap-3 p-4">
            <SearchIcon className="h-6 w-6 shrink-0 text-[var(--color-forest)]" />
            <span className="flex-1">
              <span className="block font-medium">Rechercher un bon plan</span>
              <span className="block text-sm text-[var(--color-muted)]">La carte autour de toi et toutes les offres</span>
            </span>
            <ArrowRightIcon className="h-5 w-5 shrink-0 text-[var(--color-forest)]" />
          </Link>
          {profileError && <p className="text-sm text-red-600">{profileError}</p>}
          {error && <p className="text-sm text-red-600">Impossible de charger les bons plans : {error}</p>}
          {busy && <p className="text-sm text-[var(--color-muted)]">Chargement des bons plans…</p>}
        </div>

        {!busy && !error && (
          <section>
            <h2 className="text-lg">{forYou.length > 0 ? "Pour toi" : "Les derniers bons plans"}</h2>
            {me && forYou.length === 0 && deals.length > 0 && (
              <p className="mt-1 text-sm text-[var(--color-muted)]">Rien ne correspond encore à ton profil.</p>
            )}
            {top.length === 0 ? (
              <p className="mt-1 text-sm text-[var(--color-muted)]">Aucun bon plan pour le moment.</p>
            ) : (
              <ul className="mt-3 space-y-3">{top.map(card)}</ul>
            )}
          </section>
        )}

        {!busy && sections.length > 0 && (
          <section>
            <h2 className="text-lg">Réductions &amp; aides</h2>
            <p className="text-sm text-[var(--color-muted)]">Valables dans toute une ville ou partout.</p>
            <div className="mt-3 space-y-2">
              {sections.map((s) => {
                const expanded = open === s.id;
                return (
                  <div key={s.id} className="rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : s.id)}
                      aria-expanded={expanded}
                      aria-controls={`section-${s.id}`}
                      className="flex w-full items-center gap-2 px-3 py-3 text-left"
                    >
                      <span className="flex-1 font-medium">{s.label}</span>
                      <span className="text-xs text-[var(--color-muted)]">{s.items.length}</span>
                      <ChevronDownIcon className={`h-4 w-4 text-[var(--color-muted)] transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>
                    {expanded && (
                      <ul id={`section-${s.id}`} className="space-y-3 p-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                        {s.items.map(card)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
