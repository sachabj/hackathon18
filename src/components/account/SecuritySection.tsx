"use client";

import { useState } from "react";
import { changePassword, signOutEverywhere } from "@/lib/account";
import { PASSWORD_MIN } from "@/lib/constants";
import { Feedback, inputClass, primaryClass, secondaryClass, Section, useAction } from "./ui";

export default function SecuritySection({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const password = useAction();
  const sessions = useAction();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const done = await password.run(async () => {
      if (next !== repeat) throw new Error("Les deux nouveaux mots de passe sont différents.");
      await changePassword(current, next);
      return "Mot de passe changé. Tes autres appareils sont déconnectés.";
    });
    if (done) {
      setCurrent("");
      setNext("");
      setRepeat("");
    }
  }

  return (
    <Section title="Sécurité">
      <form onSubmit={submit} className="space-y-3">
        {/* Aide le gestionnaire de mots de passe à reconnaître le compte. */}
        <input type="email" autoComplete="username" value={email} readOnly hidden />
        <label className="block text-sm font-medium">
          Mot de passe actuel
          <input type="password" autoComplete="current-password" className={inputClass} value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </label>
        <label className="block text-sm font-medium">
          Nouveau mot de passe ({PASSWORD_MIN} caractères min.)
          <input type="password" autoComplete="new-password" minLength={PASSWORD_MIN} className={inputClass} value={next} onChange={(e) => setNext(e.target.value)} required />
        </label>
        <label className="block text-sm font-medium">
          Répète le nouveau mot de passe
          <input type="password" autoComplete="new-password" minLength={PASSWORD_MIN} className={inputClass} value={repeat} onChange={(e) => setRepeat(e.target.value)} required />
        </label>
        <Feedback message={password.message} />
        <button disabled={password.busy} className={primaryClass}>
          {password.busy ? "Vérification…" : "Changer le mot de passe"}
        </button>
      </form>

      <div className="space-y-2 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
        <p className="text-sm text-[var(--color-muted)]">
          Téléphone perdu ou ordinateur partagé ? Déconnecte tous les appareils, celui-ci compris. Les autres
          peuvent rester connectés jusqu&apos;à une heure.
        </p>
        <Feedback message={sessions.message} />
        <button
          type="button"
          disabled={sessions.busy}
          className={secondaryClass}
          onClick={() =>
            sessions.run(async () => {
              await signOutEverywhere();
              // Rechargement complet : aucune page en mémoire ne doit garder les données du compte.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- rechargement voulu
              window.location.href = "/login";
            })
          }
        >
          Déconnecter tous les appareils
        </button>
      </div>
    </Section>
  );
}
