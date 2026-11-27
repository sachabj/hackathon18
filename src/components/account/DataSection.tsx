"use client";

import Link from "next/link";
import { useState } from "react";
import { exportMyData, forgetPosition, updateUsername } from "@/lib/account";
import { Feedback, inputClass, secondaryClass, Section, useAction } from "./ui";

export default function DataSection({
  userId,
  username,
  acceptedAt,
  hasPosition,
}: {
  userId: string;
  username: string;
  acceptedAt: string | null;
  hasPosition: boolean;
}) {
  const [name, setName] = useState(username);
  const [stored, setStored] = useState(hasPosition);
  const pseudo = useAction();
  const position = useAction();
  const download = useAction();

  function save(e: React.FormEvent) {
    e.preventDefault();
    pseudo.run(async () => {
      if (!name.trim()) throw new Error("Choisis un pseudo.");
      await updateUsername(userId, name.trim());
      return "Pseudo enregistré.";
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
      return "Fichier téléchargé.";
    });
  }

  return (
    <Section title="Mes données">
      <form onSubmit={save} className="space-y-2">
        <label className="block text-sm font-semibold">
          Pseudo (visible par toi seul)
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        </label>
        <Feedback message={pseudo.message} />
        <button disabled={pseudo.busy} className={secondaryClass}>Enregistrer le pseudo</button>
      </form>

      <div className="space-y-2 border-t border-zinc-100 pt-3">
        <p className="text-sm text-zinc-500">
          {stored ? "Une position approximative (~100 m) est enregistrée." : "Aucune position enregistrée."}
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
                return "Position effacée.";
              })
            }
          >
            Effacer ma position
          </button>
        )}
      </div>

      <div className="space-y-2 border-t border-zinc-100 pt-3">
        <Feedback message={download.message} />
        <button type="button" disabled={download.busy} className={secondaryClass} onClick={exportData}>
          {download.busy ? "Préparation…" : "Télécharger mes données"}
        </button>
        <p className="text-sm text-zinc-500">
          <Link href="/confidentialite" className="font-semibold text-blue-600">Politique de confidentialité</Link>
          {acceptedAt && ` · acceptée le ${new Date(acceptedAt).toLocaleDateString("fr-FR")}`}
        </p>
      </div>
    </Section>
  );
}
