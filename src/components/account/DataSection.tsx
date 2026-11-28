"use client";

import Link from "next/link";
import { useState } from "react";
import { exportMyData, forgetPosition, updateUsername } from "@/lib/account";
import { Feedback, inputClass, secondaryClass, Section, useAction } from "./ui";
import { dateLocale, useT } from "@/lib/i18n";

export default function DataSection({
  userId,
  username,
  acceptedAt,
  hasPosition,
  showUsername = true,
}: {
  userId: string;
  username: string;
  acceptedAt: string | null;
  hasPosition: boolean;
  /** Le profil étudiant modifie le pseudo dans « Informations personnelles ». */
  showUsername?: boolean;
}) {
  const [name, setName] = useState(username);
  const [stored, setStored] = useState(hasPosition);
  const t = useT();
  const pseudo = useAction();
  const position = useAction();
  const download = useAction();

  function save(e: React.FormEvent) {
    e.preventDefault();
    pseudo.run(async () => {
      if (!name.trim()) throw new Error(t("Choisis un pseudo."));
      await updateUsername(userId, name.trim());
      return t("Pseudo enregistré.");
    });
  }

  function exportData() {
    download.run(async () => {
      const blob = new Blob([JSON.stringify(await exportMyData(), null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "sharewood-mes-donnees.json";
      link.click();
      URL.revokeObjectURL(link.href);
      return t("Fichier téléchargé.");
    });
  }

  return (
    <Section title="Mes données">
      {showUsername && <form onSubmit={save} className="space-y-2">
        <label className="block text-sm font-medium">
          {t("Pseudo (visible par toi seul)")}
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        </label>
        <Feedback message={pseudo.message} />
        <button disabled={pseudo.busy} className={secondaryClass}>{t("Enregistrer le pseudo")}</button>
      </form>}

      <div className={showUsername ? "space-y-2 pt-3" : "space-y-2"} style={showUsername ? { borderTop: "1px solid var(--color-border)" } : undefined}>
        <p className="text-sm text-[var(--color-muted)]">
          {stored ? t("Une position approximative (~100 m) est enregistrée.") : t("Aucune position enregistrée.")}
        </p>
        <Feedback message={position.message} />
        {stored && (
          <button
            type="button"
            disabled={position.busy}
            className={secondaryClass}
            onClick={() =>
              position.run(async () => {
                await forgetPosition(userId);
                setStored(false);
                return t("Position effacée.");
              })
            }
          >
            {t("Effacer ma position")}
          </button>
        )}
      </div>

      <div className="space-y-2 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
        <Feedback message={download.message} />
        <button type="button" disabled={download.busy} className={secondaryClass} onClick={exportData}>
          {download.busy ? t("Préparation…") : t("Télécharger mes données")}
        </button>
        <p className="text-sm text-[var(--color-muted)]">
          <Link href="/confidentialite" className="font-medium" style={{ color: "var(--color-forest)" }}>{t("Politique de confidentialité")}</Link>
          {acceptedAt && " · " + t("acceptée le {date}", { date: new Date(acceptedAt).toLocaleDateString(dateLocale()) })}
        </p>
      </div>
    </Section>
  );
}
