"use client";

// Profil : solde de Flèches, rang, progression, série et historique récent.
import { ArrowShotIcon, FlameIcon } from "@/components/icons";
import { ARROWS, DAILY_PAID_VOTES, KIND_LABELS, rankFor, STREAK_DAYS } from "@/lib/arrows";
import { useMyArrows } from "@/lib/useMyArrows";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

export default function ArrowsCard() {
  const arrows = useMyArrows();
  // Sans la migration 016, rien à montrer.
  if (!arrows) return null;
  const { rank, next, missing, progress } = rankFor(arrows.total);
  const { streak } = arrows;
  const days = `${streak} jour${streak > 1 ? "s" : ""}`;

  return (
    <section className="sw-card space-y-3 p-4" aria-label="Mes Flèches">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="sw-eyebrow">Tes Flèches</p>
          <p className="flex items-center gap-2 text-3xl font-medium tabular-nums" style={{ color: "var(--color-forest)" }}>
            <ArrowShotIcon className="h-7 w-7" /> {arrows.total}
          </p>
        </div>
        <span className="sw-badge text-right" style={{ backgroundColor: "var(--color-aubergine)", color: "var(--color-surface)" }}>
          {rank.label}
        </span>
      </div>

      <div>
        <div
          role="progressbar"
          aria-label="Progression vers le rang suivant"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="h-2.5 overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--color-border)" }}
        >
          <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, backgroundColor: "var(--color-forest)" }} />
        </div>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {next ? `Encore ${missing} Flèches pour devenir ${next.label}` : "Rang le plus haut atteint, merci pour la communauté !"}
        </p>
      </div>

      <p className="flex items-start gap-2 text-sm">
        <FlameIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-aubergine)]" />
        <span>
          {streak === 0
            ? "Aucune série en cours : partage ou réagis aujourd'hui."
            : streak >= STREAK_DAYS
              ? <><strong>Série : {days}</strong> · gains × 1,5</>
              : <><strong>Série : {days}</strong> · × 1,5 à partir de {STREAK_DAYS} jours d&apos;affilée</>}
        </span>
      </p>
      <p className="text-sm text-[var(--color-muted)]">
        Votes récompensés aujourd&apos;hui : {Math.min(arrows.today_votes, DAILY_PAID_VOTES)} sur {DAILY_PAID_VOTES}.
        {arrows.pending > 0 && ` En attente : ${arrows.pending} Flèches (signalements à corroborer).`}
      </p>

      <details className="text-sm">
        <summary className="cursor-pointer font-medium" style={{ color: "var(--color-forest)" }}>Comment en gagner ?</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Partager un bon plan : +{ARROWS.create}, puis +{ARROWS.bonus} quand 3 étudiants le confirment.</li>
          <li>« J&apos;y suis allé » : +{ARROWS.confirm}.</li>
          <li>« Plus dispo » : +{ARROWS.report}, versées quand 3 étudiants l&apos;ont signalée.</li>
          <li>Loin d&apos;une offre sur la carte : la moitié au-delà de 500 m, rien au-delà de 2 km.</li>
        </ul>
      </details>

      <div>
        <h3 className="text-base">Historique récent</h3>
        {arrows.history.length === 0 ? (
          <p className="mt-1 text-sm text-[var(--color-muted)]">Rien pour l&apos;instant : ta première Flèche est à un geste.</p>
        ) : (
          <ul className="mt-1 divide-y" style={{ borderColor: "var(--color-border)" }}>
            {arrows.history.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2" style={{ borderColor: "var(--color-border)" }}>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{KIND_LABELS[e.kind]}</span>
                  <span className="block truncate text-xs text-[var(--color-muted)]">
                    {formatDate(e.created_at)} · {e.title ?? "offre supprimée"}
                    {Number(e.multiplier) > 1 && " · série"}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium tabular-nums" style={{ color: e.paid ? "var(--color-forest)" : "var(--color-muted)" }}>
                  {e.paid ? `+${e.amount}` : `${e.amount} en attente`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
