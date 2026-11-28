import { GraduationCapIcon, ShieldIcon, StoreIcon } from "@/components/icons";
import type { Deal } from "@/lib/types";

/**
 * Qui a publié : une source publique (offre importée, migration 024), un commerçant (offre officielle,
 * publiable seulement depuis un compte commerçant) ou un étudiant.
 */
export default function AuthorBadge({ deal, className = "" }: { deal: Pick<Deal, "is_official" | "source_name">; className?: string }) {
  if (deal.source_name) {
    return (
      <span className={`sw-badge ${className}`} style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}>
        <ShieldIcon className="h-3.5 w-3.5" /> Source officielle
      </span>
    );
  }
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
