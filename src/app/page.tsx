"use client";

// Carte : Justin · Fil + filtres (tâche 5b) : Sacha
import DealsMap from "@/components/map/DealsMapLoader";
import { APP_NAME } from "@/lib/constants";
import { useDeals } from "@/lib/useDeals";

export default function Page() {
  const { deals, loading, error } = useDeals();
  const localDeals = deals.filter((d) => d.scope === "local");
  const otherDeals = deals.filter((d) => d.scope !== "local");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      <header className="px-4 py-3">
        <h1 className="text-xl font-bold text-blue-600">{APP_NAME}</h1>
        <p className="text-sm text-zinc-500">Les bons plans étudiants autour de Bruz et Ker Lann</p>
      </header>

      <div className="h-[60dvh] min-h-80">
        <DealsMap deals={localDeals} />
      </div>

      <p role="status" className="px-4 py-2 text-sm text-zinc-500">
        {error ? (
          <span className="text-red-600">Impossible de charger les bons plans : {error}</span>
        ) : loading ? (
          "Chargement des bons plans…"
        ) : localDeals.length === 0 ? (
          "Aucun bon plan sur la carte pour le moment."
        ) : (
          `${localDeals.length} bon${localDeals.length > 1 ? "s" : ""} plan${localDeals.length > 1 ? "s" : ""} sur la carte`
        )}
      </p>

      {/* TODO Sacha (tâche 5b) : fil des bons plans « zone » / « national » (`otherDeals`) + filtres par catégorie. */}
      <section className="px-4 py-4">
        <h2 className="text-lg font-semibold">Fil des bons plans</h2>
        <p className="mt-1 text-sm text-zinc-500">
          À construire — {otherDeals.length} bon(s) plan(s) hors carte chargé(s).
        </p>
      </section>
    </div>
  );
}
