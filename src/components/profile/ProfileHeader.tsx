"use client";

// En-tête du profil : initiale, pseudo modifiable sur place, ville principale et ancienneté.
import { useLayoutEffect, useState, type FormEvent } from "react";
import { EditIcon } from "@/components/icons";
import { updateUsername } from "@/lib/account";
import { ZONES } from "@/lib/constants";

const monthYear = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

export default function ProfileHeader({
  userId,
  username,
  createdAt,
  homeZoneId,
  onSaved,
}: {
  userId: string;
  username: string | null;
  createdAt: string;
  homeZoneId: string | null;
  /** Relit le profil après l'enregistrement du pseudo. */
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Next conserve la page quittée : le champ ouvert se referme.
  useLayoutEffect(() => () => setEditing(false), []);

  const shown = username?.trim() || "Mon profil";
  const zone = ZONES.find((z) => z.id === homeZoneId)?.name;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Choisis un pseudo.");
    setBusy(true);
    setError(null);
    try {
      await updateUsername(userId, name.trim());
      setEditing(false);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  return (
    <header className="sw-card flex items-center gap-4 p-4">
      <span
        aria-hidden
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-serif text-3xl"
        style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}
      >
        {shown.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        {editing ? (
          <form onSubmit={save} className="space-y-2">
            <input
              className="sw-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              aria-label="Pseudo (visible par toi seul)"
              autoFocus
            />
            <div className="flex gap-2">
              <button disabled={busy} className="sw-btn-primary text-sm">Enregistrer</button>
              <button type="button" onClick={() => setEditing(false)} className="sw-btn-secondary text-sm">Annuler</button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="min-w-0 truncate text-2xl">{shown}</h1>
            <button
              type="button"
              onClick={() => {
                setName(username ?? "");
                setError(null);
                setEditing(true);
              }}
              aria-label="Modifier mon pseudo"
              title="Modifier mon pseudo"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--color-paper)", color: "var(--color-forest)" }}
            >
              <EditIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        {error && <p role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
        <p className="text-sm text-[var(--color-muted)]">
          {[zone, `membre depuis ${monthYear(createdAt)}`].filter(Boolean).join(" · ")}
        </p>
      </div>
    </header>
  );
}
