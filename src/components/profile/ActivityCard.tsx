import CategoryIcon from "@/components/CategoryIcon";
import { LockOpenIcon, LockClosedIcon } from "@/components/icons";
import { CATEGORIES } from "@/lib/constants";
import { activityLevel, fullAccess, LEVELS, nextLevel } from "@/lib/rules";
import type { Profile, UserContribution } from "@/lib/types";

/** Niveau d'activité, accès complet restant et message d'encouragement (tâche 10). */
export default function ActivityCard({
  profile,
  contributions,
  now,
}: {
  profile: Profile;
  contributions: UserContribution[];
  now: number;
}) {
  const week = contributions.reduce((sum, c) => sum + c.count_7d, 0);
  const level = LEVELS[activityLevel(week)];
  const next = nextLevel(week);
  const access = fullAccess(profile, now);
  const favorite = [...contributions].sort((a, b) => b.count_30d - a.count_30d).find((c) => c.count_30d > 0);
  const NextIcon = next ? LEVELS[next.level].Icon : null;

  return (
    <section className="space-y-2">
      <div
        className="rounded-2xl p-3"
        style={{
          backgroundColor: access.active ? "var(--color-sage)" : "var(--color-lilac)",
          color: access.active ? "var(--color-forest)" : "var(--color-aubergine)",
        }}
      >
        <p className="flex items-center gap-1.5 font-medium">
          {access.active ? <LockOpenIcon className="h-4 w-4" /> : <LockClosedIcon className="h-4 w-4" />}
          {access.active ? `Accès complet encore ${access.daysLeft} jour${access.daysLeft > 1 ? "s" : ""}` : "Accès limité"}
        </p>
        <p className="text-sm">
          {access.active
            ? "Chaque bon plan partagé ou confirmé remet le compteur à 7 jours."
            : "Les nouveaux bons plans t'arrivent avec 24 h de retard. Partages-en un ou confirme-en un."}
        </p>
      </div>
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
