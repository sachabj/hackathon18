// Fiabilité d'un bon plan en code couleur (tâche 30) : pastille + mot court, sans pourcentage.
import { TRUST_LEVELS, type TrustLevel } from "@/lib/rules";

export default function TrustBadge({ level, className = "" }: { level: TrustLevel | null; className?: string }) {
  if (level === null) {
    return (
      <span
        className={`sw-badge shrink-0 ${className}`}
        style={{ backgroundColor: "var(--color-lilac)", color: "var(--color-aubergine)" }}
        title="Personne n'a encore réagi à cette offre"
      >
        Nouveau
      </span>
    );
  }
  const { label, dot, bg, text } = TRUST_LEVELS[level];
  return (
    <span
      className={`sw-badge shrink-0 ${className}`}
      style={{ backgroundColor: bg, color: text }}
      title="Fiabilité d'après les « J'y suis allé » et « Plus dispo » récents"
    >
      <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dot }} />
      {label}
    </span>
  );
}
