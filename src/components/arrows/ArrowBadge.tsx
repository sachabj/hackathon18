"use client";

// Solde de Flèches dans l'en-tête des pages ; mène au détail dans le profil.
import Link from "next/link";
import { ArrowShotIcon } from "@/components/icons";
import { useMyArrows } from "@/lib/useMyArrows";

export default function ArrowBadge({ className = "" }: { className?: string }) {
  const arrows = useMyArrows();
  if (!arrows) return null;
  return (
    <Link
      href="/profil"
      aria-label={`${arrows.total} Flèches : voir mon profil`}
      className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium tabular-nums ${className}`}
      style={{ backgroundColor: "var(--color-sage)", color: "var(--color-forest)" }}
    >
      <ArrowShotIcon className="h-4 w-4" /> {arrows.total}
    </Link>
  );
}
