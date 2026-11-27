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

  return (
    <section className="space-y-2">
      <div className={`rounded-2xl p-3 ${access.active ? "bg-green-50 text-green-900" : "bg-amber-50 text-amber-900"}`}>
        <p className="font-semibold">
          {access.active
            ? `🔓 Accès complet encore ${access.daysLeft} jour${access.daysLeft > 1 ? "s" : ""}`
            : "🔒 Accès limité"}
        </p>
        <p className="text-sm">
          {access.active
            ? "Chaque bon plan signalé ou confirmé remet le compteur à 7 jours."
            : "Les nouveaux bons plans t'arrivent avec 24 h de retard. Signales-en un ou confirme-en un."}
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 p-3">
        <p className="text-lg font-bold">
          {level.emoji} {level.label}
        </p>
        <p className="text-sm text-zinc-500">
          {week} contribution{week > 1 ? "s" : ""} sur 7 jours (signalements et votes)
        </p>
        <p className="mt-1 text-sm font-medium text-blue-700">
          {favorite &&
            `Ta spécialité : les bons plans ${CATEGORIES[favorite.category].label} ${CATEGORIES[favorite.category].emoji}. `}
          {next
            ? `Encore ${next.missing} contribution${next.missing > 1 ? "s" : ""} pour passer ${LEVELS[next.level].label} ${LEVELS[next.level].emoji} !`
            : "Tu es au sommet, merci pour la communauté !"}
        </p>
      </div>
    </section>
  );
}
