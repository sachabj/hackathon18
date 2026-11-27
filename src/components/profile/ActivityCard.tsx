import { activityLevel, LEVELS, nextLevel } from "@/lib/rules";
import type { UserContribution } from "@/lib/types";

/** Niveau d'activité sur une ligne (tâche 10) ; il ne limite aucun accès. */
export default function ActivityCard({ contributions }: { contributions: UserContribution[] }) {
  const week = contributions.reduce((sum, c) => sum + c.count_7d, 0);
  const level = LEVELS[activityLevel(week)];
  const next = nextLevel(week);

  return (
    <p className="sw-card flex items-start gap-2 p-3 text-sm">
      <level.Icon className="h-5 w-5 shrink-0 text-[var(--color-forest)]" />
      <span>
        <strong style={{ color: "var(--color-forest)" }}>{level.label}</strong>
        {next
          ? ` · encore ${next.missing} contribution${next.missing > 1 ? "s" : ""} pour passer ${LEVELS[next.level].label}`
          : " · tu es au sommet, merci pour la communauté !"}
      </span>
    </p>
  );
}
