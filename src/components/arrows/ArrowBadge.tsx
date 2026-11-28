"use client";

// Flèches disponibles dans l'en-tête des pages ; mène à la page Ciblés.
import Link from "next/link";
import { ArrowShotIcon } from "@/components/icons";
import { useMyArrows } from "@/lib/useMyArrows";

export default function ArrowBadge({ className = "" }: { className?: string }) {
  const arrows = useMyArrows();
  if (!arrows) return null;
  const balance = Math.max(0, arrows.current_arrows_balance);
  return (
    <Link
      href="/favoris"
      // Point d'arrivée de la pastille « +N » au gain de Flèches (ArrowFlight, tâche 75).
      data-arrow-target
      aria-label={`${balance} Flèches disponibles : ouvrir Ciblés`}
      className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium tabular-nums ${className}`}
      style={{ backgroundColor: "var(--color-sage)", color: "var(--color-forest)" }}
    >
      <ArrowShotIcon className="h-4 w-4" /> {balance}
    </Link>
  );
}
