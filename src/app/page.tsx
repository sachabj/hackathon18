"use client";

// Carte : Justin · Fil, filtres et « Pour toi » : Sacha
import Link from "next/link";
import { useState } from "react";
import DealCard from "@/components/feed/DealCard";
import DealsMap from "@/components/map/DealsMapLoader";
import { APP_NAME, BUDGET_PROFILES, CATEGORIES, TRANSPORT_MODES, ZONES } from "@/lib/constants";
import { rankDeals, toStudentProfile, type Match } from "@/lib/matching";
import type { Deal, DealCategory } from "@/lib/types";
import { useDeals } from "@/lib/useDeals";
import { usePreferences } from "@/lib/usePreferences";

export default function Page() {
  const { deals, loading, error } = useDeals();
  const { profile, preferences, loading: loadingProfile, error: profileError } = usePreferences();
  const [chosenTab, setTab] = useState<"forYou" | "all" | null>(null);
  const [category, setCategory] = useState<DealCategory | null>(null);

  const me = profile?.onboarded ? toStudentProfile(profile, preferences) : null;
  const tab = me ? (chosenTab ?? "forYou") : "all";
  const ranked: { deal: Deal; match?: Match }[] = me
    ? rankDeals(deals, me)
    : deals.map((deal) => ({ deal }));
  const forYouCount = ranked.filter((r) => r.match?.forYou).length;

  // « Tout » reste chronologique ; « Pour toi » est trié par compatibilité.
  const inTab =
    tab === "forYou"
      ? ranked.filter((r) => r.match?.forYou)
      : [...ranked].sort((a, b) => b.deal.created_at.localeCompare(a.deal.created_at));
  const shown = category ? inTab.filter((r) => r.deal.category === category) : inTab;
  const mapDeals = shown.map((r) => r.deal).filter((d) => d.scope === "local");

  // Les priorités de l'étudiant en premier.
  const categories = (Object.keys(CATEGORIES) as DealCategory[]).sort((a, b) => {
    const rank = (c: DealCategory) => {
      const i = me?.categories.indexOf(c) ?? -1;
      return i < 0 ? Infinity : i;
    };
    return rank(a) === rank(b) ? 0 : rank(a) - rank(b);
  });
  const home = ZONES.find((z) => z.id === me?.homeZoneId);
  const busy = loading || loadingProfile;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      <header className="px-4 py-3">
        <p className="text-sm font-bold text-blue-600">{APP_NAME}</p>
        <h1 className="text-xl font-bold">
          {profile?.username ? `Salut ${profile.username} 👋` : "Les bons plans étudiants"}
        </h1>
        {me && (
          <Link
            href="/onboarding"
            className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-sm"
          >
            <span>
              {[
                home && `📍 ${home.name}`,
                me.transportModes.map((m) => TRANSPORT_MODES[m].emoji).join(" "),
                me.budget && `${BUDGET_PROFILES[me.budget].emoji} ${BUDGET_PROFILES[me.budget].label}`,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </span>
            <span className="shrink-0 font-semibold text-blue-600">Modifier</span>
          </Link>
        )}
        {profile && !profile.onboarded && (
          <Link href="/onboarding" className="mt-2 block rounded-xl bg-blue-600 px-4 py-3 text-white">
            <span className="block font-semibold">🎯 Personnalise tes bons plans</span>
            <span className="block text-sm text-blue-100">
              1 minute pour voir ce qui correspond à ta zone, ton budget et tes envies.
            </span>
          </Link>
        )}
        {profileError && <p className="mt-2 text-sm text-red-600">{profileError}</p>}
      </header>

      {me && (
        <div className="mx-4 grid grid-cols-2 rounded-full bg-zinc-100 p-1 text-sm font-semibold">
          {(["forYou", "all"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full py-2 ${tab === t ? "bg-white text-blue-600 shadow" : "text-zinc-500"}`}
            >
              {t === "forYou" ? `🎯 Pour toi (${forYouCount})` : `Tout (${deals.length})`}
            </button>
          ))}
        </div>
      )}

      <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
        {[null, ...categories].map((c) => (
          <button
            key={c ?? "all"}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${category === c ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-200 text-zinc-700"}`}
          >
            {c ? `${CATEGORIES[c].emoji} ${CATEGORIES[c].label}` : "Toutes"}
          </button>
        ))}
      </div>

      <div className="h-[40dvh] min-h-64">
        <DealsMap deals={mapDeals} homeZoneId={me?.homeZoneId} />
      </div>

      <section className="px-4 py-4">
        <h2 className="text-lg font-semibold">
          {tab === "forYou" ? "Sélectionnés pour toi" : "Fil des bons plans"}
        </h2>
        <p role="status" className="mt-1 text-sm text-zinc-500">
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
                <DealCard deal={deal} match={match} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
