"use client";

// Fiabilité d'un bon plan en code couleur (tâche 30) : pastille + mot court, sans pourcentage.
// Tâche 75 : la couleur change en fondu et le badge rebondit quand le niveau change (après une réaction).
import { TRUST_LEVELS, type TrustLevel } from "@/lib/rules";
import { useChanges } from "@/lib/motion";

export default function TrustBadge({ level, className = "" }: { level: TrustLevel | null; className?: string }) {
  const changed = useChanges(level);
  const pop = changed.count > 0 ? "sw-trust-pop" : "";
  if (level === null) {
    return (
      <span
        key={changed.count}
        className={`sw-badge sw-trust shrink-0 ${pop} ${className}`}
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
      className={`sw-badge sw-trust shrink-0 ${className}`}
      style={{ backgroundColor: bg, color: text }}
      title="Fiabilité d'après les « J'en ai profité » et « Plus dispo » récents"
    >
      {/* Seul le contenu est rejoué : le fond garde sa transition de couleur. */}
      <span key={changed.count} className={`inline-flex items-center gap-[0.35rem] ${pop}`}>
        <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full transition-colors duration-500" style={{ backgroundColor: dot }} />
        {label}
      </span>
    </span>
  );
}
