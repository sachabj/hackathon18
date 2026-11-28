"use client";

// Informations personnelles : pseudo et école modifiables, email et ville affichés.
import Link from "next/link";
import { useState } from "react";
import { Feedback, inputClass, primaryClass, useAction } from "@/components/account/ui";
import { updateUsername } from "@/lib/account";
import { saveSchool } from "@/lib/community";

export default function PersonalInfo({
  userId,
  username,
  email,
  school,
  city,
  onSaved,
}: {
  userId: string;
  username: string;
  email: string;
  school: string;
  /** Zone principale, si elle est choisie */
  city: string | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(username);
  const [place, setPlace] = useState(school);
  const action = useAction();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    action.run(async () => {
      if (!name.trim()) throw new Error("Choisis un pseudo.");
      if (name.trim() !== username) await updateUsername(userId, name.trim());
      if (place.trim() !== school) await saveSchool(userId, place);
      onSaved();
      return "Informations enregistrées.";
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm font-medium">
        Pseudo (visible par toi seul)
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
      </label>
      <label className="block text-sm font-medium">
        École ou université (facultatif, visible par toi seul)
        <input className={inputClass} value={place} onChange={(e) => setPlace(e.target.value)} maxLength={80} autoComplete="organization" />
      </label>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--color-muted)]">Email</dt>
          <dd className="min-w-0 break-all text-right">{email}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--color-muted)]">Ville</dt>
          <dd className="text-right">
            {city ?? "Non renseignée"} ·{" "}
            <Link href="/onboarding?etape=zone" className="font-medium underline" style={{ color: "var(--color-forest)" }}>
              Modifier
            </Link>
          </dd>
        </div>
      </dl>
      <Feedback message={action.message} />
      <button disabled={action.busy} className={primaryClass}>Enregistrer</button>
    </form>
  );
}
