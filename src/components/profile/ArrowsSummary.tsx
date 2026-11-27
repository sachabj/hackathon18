"use client";

// Résumé des Flèches sur le profil ; le détail (série, grades, boutique) reste dans « Ciblés ».
import Link from "next/link";
import { ArrowShotIcon } from "@/components/icons";
import { rankFor } from "@/lib/arrows";
import { useMyArrows } from "@/lib/useMyArrows";

export default function ArrowsSummary() {
  const arrows = useMyArrows();
  // Sans la migration 016 (Flèches), rien à montrer.
  if (!arrows) return null;
  const { rank, next, missing, progress } = rankFor(arrows.total_arrows_earned);

  return (
    <Link href="/favoris?onglet=recompenses" className="sw-card block space-y-2 p-4" aria-label="Mon grade et mes Flèches : ouvrir les récompenses">
      <span className="flex items-center justify-between gap-2">
        <span className="font-serif text-lg">{rank.label}</span>
        <span className="flex items-center gap-1 font-medium tabular-nums" style={{ color: "var(--color-forest)" }}>
          <ArrowShotIcon className="h-4 w-4" /> {Math.max(0, arrows.current_arrows_balance)}
        </span>
      </span>
      <span aria-hidden className="block h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
        <span className="block h-full rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: "var(--color-forest)" }} />
      </span>
      <span className="block text-sm text-[var(--color-muted)]">
        {next ? `Encore ${missing} Flèches pour devenir ${next.label}` : "Grade le plus haut atteint"}
      </span>
    </Link>
  );
}
