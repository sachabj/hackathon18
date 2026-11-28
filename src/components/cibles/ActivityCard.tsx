"use client";

import { activityLevel, LEVELS, nextLevel } from "@/lib/rules";
import type { UserContribution } from "@/lib/types";
import { useT } from "@/lib/i18n";

/** Niveau d'activité sur une ligne (tâche 10) ; il ne limite aucun accès. */
export default function ActivityCard({ contributions }: { contributions: UserContribution[] }) {
  const t = useT();
  const week = contributions.reduce((sum, c) => sum + c.count_7d, 0);
  const level = LEVELS[activityLevel(week)];
  const next = nextLevel(week);

  return (
    <p className="sw-card flex items-start gap-2 p-3 text-sm">
      <level.Icon className="h-5 w-5 shrink-0 text-[var(--color-forest)]" />
      <span>
        <strong style={{ color: "var(--color-forest)" }}>{t(level.label)}</strong>
        {next
          ? " · " + t(next.missing > 1 ? "encore {n} contributions pour passer {level}" : "encore {n} contribution pour passer {level}", { n: next.missing, level: t(LEVELS[next.level].label) })
          : " · " + t("tu es au sommet, merci pour la communauté !")}
      </span>
    </p>
  );
}
