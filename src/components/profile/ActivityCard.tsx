import CategoryIcon from "@/components/CategoryIcon";
import { CATEGORIES } from "@/lib/constants";
import { activityLevel, LEVELS, nextLevel } from "@/lib/rules";
import type { UserContribution } from "@/lib/types";

/** Niveau d'activité et message d'encouragement (tâche 10) ; il ne limite aucun accès. */
export default function ActivityCard({ contributions }: { contributions: UserContribution[] }) {
  const week = contributions.reduce((sum, c) => sum + c.count_7d, 0);
  const level = LEVELS[activityLevel(week)];
  const next = nextLevel(week);
  const favorite = [...contributions].sort((a, b) => b.count_30d - a.count_30d).find((c) => c.count_30d > 0);
  const NextIcon = next ? LEVELS[next.level].Icon : null;

  return (
    <section>
      <div className="sw-card p-3">
        <p className="flex items-center gap-1.5 text-lg font-medium" style={{ color: "var(--color-forest)" }}>
          <level.Icon className="h-5 w-5" /> {level.label}
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          {week} contribution{week > 1 ? "s" : ""} sur 7 jours (signalements et votes)
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-1 text-sm font-medium" style={{ color: "var(--color-aubergine)" }}>
          {favorite && (
            <>
              Ta spécialité : les bons plans {CATEGORIES[favorite.category].label}
              <CategoryIcon category={favorite.category} size={18} />.
            </>
          )}
          {next && NextIcon ? (
            <>
              Encore {next.missing} contribution{next.missing > 1 ? "s" : ""} pour passer {LEVELS[next.level].label}
              <NextIcon className="h-4 w-4" />!
            </>
          ) : (
            "Tu es au sommet, merci pour la communauté !"
          )}
        </p>
      </div>
    </section>
  );
}
