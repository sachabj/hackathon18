// Rang d'influence de l'étudiant (tâche 33), comme les niveaux Waze : visible par lui seul.
// Affiché en bas de la carte des Flèches, sur la page « Ciblés ».
import { CheckBadgeIcon } from "@/components/icons";
import { INFLUENCE_RANKS, influenceRank } from "@/lib/rules";
import type { Influence } from "@/lib/trust";

export default function InfluenceBlock({ me }: { me: Influence }) {
  const rank = influenceRank(me.weight);
  const step = INFLUENCE_RANKS.findIndex((r) => r.id === rank.id);
  const tips = [
    me.account_days < 3 && "Ton compte est tout neuf : ton avis comptera pleinement dans quelques jours.",
    me.contributions_30d < 20 && "Réagis aux offres (« J'y suis allé », « Plus dispo ») et partage des bons plans.",
    me.judged >= 3 && me.accuracy < 0.6 && "Plusieurs de tes avis ont été contredits : ne réagis que si tu as vérifié sur place.",
  ].filter(Boolean) as string[];

  return (
    <div>
      <h2 className="flex items-center gap-1.5 text-base">
        <CheckBadgeIcon className="h-5 w-5 text-[var(--color-forest)]" /> Ton influence : {rank.label}
      </h2>
      {/* Paliers : Débutant → Confirmé → Expert */}
      <ol className="mt-2 grid grid-cols-3 gap-1.5" aria-label="Paliers">
        {[...INFLUENCE_RANKS].reverse().map((r) => {
          const reached = INFLUENCE_RANKS.findIndex((x) => x.id === r.id) >= step;
          return (
            <li
              key={r.id}
              className="rounded-full py-1 text-center text-xs font-medium"
              style={
                reached
                  ? { backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }
                  : { backgroundColor: "var(--color-paper)", color: "var(--color-muted)" }
              }
            >
              {r.label}
            </li>
          );
        })}
      </ol>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer font-medium" style={{ color: "var(--color-forest)" }}>Comment ça marche ?</summary>
        <p className="mt-1 text-[var(--color-muted)]">
          Comme sur Waze, l&apos;avis des étudiants fiables pèse plus lourd : il dépend de l&apos;ancienneté de ton compte,
          de ton activité sur 30 jours et de la justesse de tes réactions
          {me.judged > 0 && ` (${me.judged} avis comparés à ceux des autres)`}.
        </p>
        {tips.length > 0 && rank.id !== "expert" && (
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}
