"use client";

// Informations personnelles : pseudo et école modifiables, email et ville affichés.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Feedback, inputClass, primaryClass, useAction } from "@/components/account/ui";
import { updateUsername } from "@/lib/account";
import { saveSchool } from "@/lib/community";
import { fetchSchools, saveSchoolChoice, type School } from "@/lib/schools";
import { useT } from "@/lib/i18n";

export default function PersonalInfo({
  userId,
  username,
  email,
  school,
  schoolId,
  city,
  onSaved,
}: {
  userId: string;
  username: string;
  email: string;
  school: string;
  /** École de la liste (classement des écoles), ou null */
  schoolId: string | null;
  /** Zone principale, si elle est choisie */
  city: string | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(username);
  const [place, setPlace] = useState(school);
  /** Liste des écoles (vide sans la migration 028 : seul le texte libre reste). */
  const [schools, setSchools] = useState<School[]>([]);
  /** id d'une école de la liste, "other" (texte libre) ou "" (non renseignée) */
  const [choice, setChoice] = useState(schoolId ?? (school ? "other" : ""));
  useEffect(() => {
    let cancelled = false;
    fetchSchools().then((list) => !cancelled && setSchools(list));
    return () => {
      cancelled = true;
    };
  }, []);
  const action = useAction();
  const t = useT();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    action.run(async () => {
      if (!name.trim()) throw new Error(t("Choisis un pseudo."));
      if (name.trim() !== username) await updateUsername(userId, name.trim());
      if (schools.length > 0) {
        const id = choice && choice !== "other" ? choice : null;
        const other = choice === "other" ? place : "";
        if (id !== schoolId || other.trim() !== (schoolId ? "" : school)) await saveSchoolChoice(userId, id, other);
      } else if (place.trim() !== school) await saveSchool(userId, place);
      onSaved();
      return t("Informations enregistrées.");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm font-medium">
        {t("Pseudo (visible par toi seul)")}
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
      </label>
      {schools.length > 0 ? (
        <>
          <label className="block text-sm font-medium">
            {t("École ou université (facultatif)")}
            <select className={inputClass} value={choice} onChange={(e) => setChoice(e.target.value)}>
              <option value="">{t("Non renseignée")}</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="other">{t("Autre")}</option>
            </select>
          </label>
          {choice === "other" ? (
            <label className="block text-sm font-medium">
              {t("Nom de ton école")}
              <input className={inputClass} value={place} onChange={(e) => setPlace(e.target.value)} maxLength={80} autoComplete="organization" />
              <span className="mt-1 block text-xs font-normal text-[var(--color-muted)]">{t("Une école hors de la liste ne compte pas au classement.")}</span>
            </label>
          ) : (
            <p className="text-xs text-[var(--color-muted)]">{t("Ton école compte au classement des écoles (page Ciblés) : seuls des totaux par école sont affichés.")}</p>
          )}
        </>
      ) : (
        <label className="block text-sm font-medium">
          {t("École ou université (facultatif, visible par toi seul)")}
          <input className={inputClass} value={place} onChange={(e) => setPlace(e.target.value)} maxLength={80} autoComplete="organization" />
        </label>
      )}
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--color-muted)]">{t("Email")}</dt>
          <dd className="min-w-0 break-all text-right">{email}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--color-muted)]">{t("Ville")}</dt>
          <dd className="text-right">
            {city ?? t("Non renseignée")} ·{" "}
            <Link href="/onboarding?etape=zone" className="font-medium underline" style={{ color: "var(--color-forest)" }}>
              {t("Modifier")}
            </Link>
          </dd>
        </div>
      </dl>
      <Feedback message={action.message} />
      <button disabled={action.busy} className={primaryClass}>{t("Enregistrer")}</button>
    </form>
  );
}
