"use client";

import { useState } from "react";
import { deleteAccount, previewDeletion } from "@/lib/account";
import { Feedback, inputClass, secondaryClass, Section, useAction } from "./ui";
import { useT } from "@/lib/i18n";

export default function DeleteSection() {
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewDeletion>> | null>(null);
  const [password, setPassword] = useState("");
  const t = useT();
  const action = useAction();

  function open() {
    action.run(async () => setPreview(await previewDeletion()));
  }

  function close() {
    setPreview(null);
    setPassword("");
    action.clear();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    action.run(async () => {
      await deleteAccount(password);
      // Rechargement complet : aucune page en mémoire ne doit garder les données du compte.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- rechargement voulu
      window.location.href = "/login";
    });
  }

  return (
    <Section title="Supprimer mon compte">
      {!preview ? (
        <>
          <Feedback message={action.message} />
          <button type="button" disabled={action.busy} onClick={open} className={`${secondaryClass} border-red-300 text-red-600`}>
            {t("Supprimer mon compte…")}
          </button>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <ul className="list-disc space-y-1 rounded-xl bg-red-50 py-3 pl-7 pr-3 text-sm text-red-900">
            <li>{t("Ton compte, tes préférences, tes votes et tes favoris sont effacés définitivement.")}</li>
            <li>
              {t(preview.deleted > 1 ? "{n} bons plans effacés." : "{n} bon plan effacé.", { n: preview.deleted })}
            </li>
            <li>
              {t(preview.kept > 1 ? "{n} bons plans encore actifs et confirmés par d'autres : conservés, sans lien avec toi." : "{n} bon plan encore actif et confirmé par d'autres : conservé, sans lien avec toi.", { n: preview.kept })}
            </li>
          </ul>
          <label className="block text-sm font-medium">
            {t("Ton mot de passe pour confirmer")}
            <input type="password" autoComplete="current-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <Feedback message={action.message} />
          <button disabled={action.busy} className="w-full rounded-xl bg-red-600 py-2.5 font-semibold text-white disabled:opacity-50">
            {action.busy ? t("Suppression…") : t("Supprimer définitivement")}
          </button>
          <button type="button" onClick={close} className={secondaryClass}>{t("Annuler")}</button>
        </form>
      )}
    </Section>
  );
}
