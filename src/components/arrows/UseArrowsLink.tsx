"use client";

// Profil : accès à la boutique, avec le Badge Doré s'il est activé.
import Link from "next/link";
import { ArrowShotIcon, StarIcon } from "@/components/icons";
import { useMyArrows } from "@/lib/useMyArrows";

export default function UseArrowsLink() {
  const arrows = useMyArrows();
  if (!arrows) return null;
  return (
    <div className="space-y-2">
      {arrows.golden_badge && (
        <p className="sw-badge" style={{ background: "#d4a017", color: "#2b1f00" }}>
          <StarIcon className="h-3.5 w-3.5" filled /> Badge Doré
        </p>
      )}
      <Link href="/favoris?onglet=recompenses" className="sw-btn-primary w-full">
        <ArrowShotIcon className="h-4 w-4" /> Utiliser mes Flèches ({Math.max(0, arrows.current_arrows_balance)})
      </Link>
    </div>
  );
}
