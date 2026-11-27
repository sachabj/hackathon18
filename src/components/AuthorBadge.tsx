import { GraduationCapIcon, StoreIcon } from "@/components/icons";
import type { Deal } from "@/lib/types";

/** Qui a publié : un commerçant (offre officielle, publiable seulement depuis un compte commerçant) ou un étudiant. */
export default function AuthorBadge({ deal, className = "" }: { deal: Pick<Deal, "is_official">; className?: string }) {
  const Icon = deal.is_official ? StoreIcon : GraduationCapIcon;
  return (
    <span
      className={`sw-badge ${className}`}
      style={
        deal.is_official
          ? { backgroundColor: "var(--color-aubergine)", color: "var(--color-surface)" }
          : { border: "1px solid var(--color-border)", color: "var(--color-muted)" }
      }
    >
      <Icon className="h-3.5 w-3.5" /> {deal.is_official ? "Commerçant" : "Étudiant"}
    </span>
  );
}
