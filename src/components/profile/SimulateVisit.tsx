"use client";

// « Simuler ma position » (tâche 11) : choisir une offre de la carte pour recevoir la notification « toujours dispo ? ».
import { useState } from "react";
import { PinIcon } from "@/components/icons";
import { simulateVisit } from "@/lib/nearby";
import { useCurrentUserId } from "@/lib/useCurrentUserId";
import { useDeals } from "@/lib/useDeals";
import { useT } from "@/lib/i18n";

export default function SimulateVisit() {
  const { deals, loading, error } = useDeals();
  const userId = useCurrentUserId();
  const [choice, setChoice] = useState("");
  // Offres placées sur la carte, sauf les siennes (on ne réagit pas à son propre bon plan).
  const placed = deals
    .filter((d) => d.lat !== null && d.lng !== null && d.author_id !== userId)
    .sort((a, b) => (a.place_name ?? "").localeCompare(b.place_name ?? "", "fr") || a.title.localeCompare(b.title, "fr"));
  const selected = placed.find((d) => d.id === choice) ?? null;

  const t = useT();
  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-muted)]">
        {t("Sur une vraie application, ton téléphone te préviendrait en passant devant un bon plan. Ici, choisis l'offre devant laquelle tu te trouves : seule la notification est simulée, ta position réelle n'est pas modifiée.")}
      </p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <label className="block text-sm font-medium">
        {t("Je suis devant")}
        <select className="sw-field mt-1 text-base font-normal" value={choice} onChange={(e) => setChoice(e.target.value)} disabled={loading}>
          <option value="">{loading ? t("Chargement des offres…") : t("Choisis une offre de la carte")}</option>
          {placed.map((d) => (
            <option key={d.id} value={d.id}>
              {d.place_name ? `${d.place_name.split(" · ")[0]} — ${d.title}` : d.title}
            </option>
          ))}
        </select>
      </label>
      <button type="button" disabled={!selected} onClick={() => selected && simulateVisit(selected)} className="sw-btn-primary w-full disabled:opacity-50">
        <PinIcon className="h-4 w-4" /> {t("Simuler ma position")}
      </button>
    </div>
  );
}
