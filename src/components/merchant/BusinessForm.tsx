"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import type { Point } from "@/lib/geo";
import { BUSINESS_CATEGORIES, registerBusiness } from "@/lib/merchant";
import type { DealCategory } from "@/lib/types";
import { buttonClass, inputClass } from "./styles";
import { useT } from "@/lib/i18n";

const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-64 rounded-2xl bg-[var(--color-paper)]" />,
});

/** Première visite d'un commerçant : décrire son commerce. */
export default function BusinessForm({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<DealCategory>("restaurant");
  const [position, setPosition] = useState<Point | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!position) return setError(t("Place ton commerce sur la carte."));
    setSaving(true);
    setError(null);
    try {
      await registerBusiness({ name, address, category, position });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-[var(--color-muted)]">
        {t("Décris ton commerce pour publier des offres officielles. L'emplacement ne pourra plus être modifié.")}
      </p>
      <label className="block text-sm font-medium">
        {t("Nom du commerce")}
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} required />
      </label>
      <label className="block text-sm font-medium">
        {t("Adresse")}{" "}<span className="font-normal text-[var(--color-muted)]">{t("(facultatif)")}</span>
        <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} />
      </label>
      <label className="block text-sm font-medium">
        {t("Activité")}
        <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as DealCategory)}>
          {BUSINESS_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(CATEGORIES[c].label)}
            </option>
          ))}
        </select>
      </label>
      <div>
        <p className="mb-1 text-sm font-medium">{t("Emplacement : touche la carte")}</p>
        <LocationPicker value={position} onChange={setPosition} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button disabled={saving} className={buttonClass}>
        {saving ? t("Enregistrement…") : t("Créer mon espace commerçant")}
      </button>
    </form>
  );
}
