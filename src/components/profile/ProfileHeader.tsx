"use client";

// En-tête du profil : initiale, pseudo, ville et ancienneté, puis grade et solde de Flèches.
import Link from "next/link";
import { ArrowShotIcon, EditIcon } from "@/components/icons";
import { rankFor } from "@/lib/arrows";
import { ZONES } from "@/lib/constants";
import { useMyArrows } from "@/lib/useMyArrows";

const monthYear = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

export default function ProfileHeader({
  username,
  createdAt,
  homeZoneId,
  onEdit,
}: {
  username: string | null;
  createdAt: string;
  homeZoneId: string | null;
  /** Ouvre « Informations personnelles ». */
  onEdit: () => void;
}) {
  // Sans la migration 016 (Flèches) : ni grade ni solde.
  const arrows = useMyArrows();
  const shown = username?.trim() || "Mon profil";
  const zone = ZONES.find((z) => z.id === homeZoneId)?.name;

  return (
    <header className="sw-card space-y-3 p-4">
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-serif text-3xl"
          style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}
        >
          {shown.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="min-w-0 truncate text-2xl">{shown}</h1>
            <button
              type="button"
              onClick={onEdit}
              aria-label="Modifier mes informations"
              title="Modifier mes informations"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--color-paper)", color: "var(--color-forest)" }}
            >
              <EditIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            {[zone, `membre depuis ${monthYear(createdAt)}`].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      {arrows && (
        <Link
          href="/favoris?onglet=recompenses"
          className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium"
          style={{ backgroundColor: "var(--color-paper)", color: "var(--color-forest)" }}
        >
          <span>{rankFor(arrows.total_arrows_earned).rank.label}</span>
          <span className="flex items-center gap-1 tabular-nums">
            <ArrowShotIcon className="h-4 w-4" /> {Math.max(0, arrows.current_arrows_balance)} Flèches
          </span>
        </Link>
      )}
    </header>
  );
}
