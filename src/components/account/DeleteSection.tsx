"use client";

import { useState } from "react";
import { deleteAccount, previewDeletion } from "@/lib/account";
import { Feedback, inputClass, secondaryClass, Section, useAction } from "./ui";

const plural = (n: number) => (n > 1 ? "s" : "");

export default function DeleteSection() {
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewDeletion>> | null>(null);
  const [password, setPassword] = useState("");
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
            Supprimer mon compte…
          </button>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <ul className="list-disc space-y-1 rounded-xl bg-red-50 py-3 pl-7 pr-3 text-sm text-red-900">
            <li>Ton compte, tes préférences, tes votes et tes favoris sont effacés définitivement.</li>
            <li>
              {preview.deleted} bon{plural(preview.deleted)} plan{plural(preview.deleted)} effacé{plural(preview.deleted)}.
            </li>
            <li>
              {preview.kept} bon{plural(preview.kept)} plan{plural(preview.kept)} encore actif{plural(preview.kept)} et
              confirmé{plural(preview.kept)} par d&apos;autres : conservé{plural(preview.kept)}, sans lien avec toi.
            </li>
          </ul>
          <label className="block text-sm font-medium">
            Ton mot de passe pour confirmer
            <input type="password" autoComplete="current-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <Feedback message={action.message} />
          <button disabled={action.busy} className="w-full rounded-xl bg-red-600 py-2.5 font-semibold text-white disabled:opacity-50">
            {action.busy ? "Suppression…" : "Supprimer définitivement"}
          </button>
          <button type="button" onClick={close} className={secondaryClass}>Annuler</button>
        </form>
      )}
    </Section>
  );
}
