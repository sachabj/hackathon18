"use client";

import { useState } from "react";
import { CATEGORIES, PRICE_LEVELS, TITLE_MAX } from "@/lib/constants";
import { BUSINESS_CATEGORIES, type OfferInput } from "@/lib/merchant";
import type { Deal, DealCategory } from "@/lib/types";
import { buttonClass, inputClass } from "./styles";
import { useT } from "@/lib/i18n";

/** Date ISO → valeur d'un champ date (jour local). */
const toDay = (iso: string) => new Date(iso).toLocaleDateString("sv-SE");

/** Création d'une offre officielle, ou modification si `offer` est fourni. */
export default function OfferForm({
  offer,
  defaultCategory,
  onSubmit,
  onCancel,
}: {
  offer?: Deal;
  defaultCategory: DealCategory;
  onSubmit: (input: OfferInput, flash: boolean) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useT();
  const [title, setTitle] = useState(offer?.title ?? "");
  const [description, setDescription] = useState(offer?.description ?? "");
  const [category, setCategory] = useState<DealCategory>(offer?.category ?? defaultCategory);
  const [priceLevel, setPriceLevel] = useState(offer?.price_level?.toString() ?? "");
  const [lastDay, setLastDay] = useState(offer?.expires_at ? toDay(offer.expires_at) : "");
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(
        {
          title: title.trim(),
          description: description.trim() || null,
          category,
          // Plus de champ montant (tâche 37) : le titre dit l'avantage ; une ancienne valeur est conservée.
          price_info: offer?.price_info ?? null,
          price_level: priceLevel === "" ? null : Number(priceLevel),
          // L'offre reste valable jusqu'à la fin du dernier jour.
          expires_at: lastDay ? new Date(`${lastDay}T23:59:59`).toISOString() : null,
        },
        flash,
      );
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="sw-card space-y-3 p-3" style={{ borderColor: "var(--color-forest)", borderWidth: 2 }}>
      <h3 className="font-medium">{offer ? t("Modifier l'offre") : t("Nouvelle offre officielle")}</h3>
      <label className="block text-sm font-medium">
        {t("Titre")}
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("Menu étudiant à 6,50 €")} maxLength={TITLE_MAX} required />
      </label>
      <label className="block text-sm font-medium">
        {t("Détails")}{" "}<span className="font-normal text-[var(--color-muted)]">{t("(facultatif)")}</span>
        <textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
      </label>
      <label className="block text-sm font-medium">
        {t("Catégorie")}
        <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as DealCategory)}>
          {BUSINESS_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(CATEGORIES[c].label)}
            </option>
          ))}
        </select>
      </label>
      <div>
        <label className="block text-sm font-medium">
          {t("Gamme de prix")}
          <select className={inputClass} value={priceLevel} onChange={(e) => setPriceLevel(e.target.value)}>
            <option value="">{t("Non précisée")}</option>
            {PRICE_LEVELS.map((p) => (
              <option key={p.value} value={p.value}>
                {t(p.label)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">
        {t("Dernier jour")}{" "}<span className="font-normal text-[var(--color-muted)]">{t("(facultatif)")}</span>
        <input type="date" className={inputClass} value={lastDay} min={toDay(new Date().toISOString())} onChange={(e) => setLastDay(e.target.value)} />
      </label>
      {!offer && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={flash} onChange={(e) => setFlash(e.target.checked)} />
          <span>
            <span className="font-medium">{t("Offre flash")}</span>
            <span className="block text-[var(--color-muted)]">
              {t("Pendant 1 h, seuls les étudiants qui ont l'Accès Avant-Première la voient.")}
            </span>
          </span>
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button disabled={saving} className={buttonClass}>
        {saving ? t("Enregistrement…") : offer ? t("Enregistrer") : t("Publier l'offre")}
      </button>
      <button type="button" onClick={onCancel} className="w-full py-1 text-sm font-medium text-[var(--color-muted)]">
        {t("Annuler")}
      </button>
    </form>
  );
}
