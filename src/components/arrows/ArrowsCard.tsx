"use client";

// Haut de la page « Ciblés » : Flèches (solde, progression, série) et grade, en une carte.
import { ArrowShotIcon, FlameIcon, StarIcon } from "@/components/icons";
import { rankFor, RANKS, STREAK_DAYS } from "@/lib/arrows";
import { useMyArrows } from "@/lib/useMyArrows";
import { dateLocale, useT } from "@/lib/i18n";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(dateLocale(), { day: "numeric", month: "long" });

export default function ArrowsCard() {
  const arrows = useMyArrows();
  const t = useT();
  // Sans la migration 016 (Flèches), rien à montrer.
  if (!arrows) return null;

  return (
    <section className="sw-card space-y-3 p-4" aria-label={t("Mes Flèches")}>
      <Arrows arrows={arrows} />
      <div className="border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
        <Grade earned={arrows.total_arrows_earned} />
      </div>
    </section>
  );
}

/** Les trois grades, seul celui de l'étudiant éclairé ; il dépend des Flèches gagnées. */
function Grade({ earned }: { earned: number }) {
  const t = useT();
  const { rank } = rankFor(earned);
  return (
    <div>
      <h2 className="text-base">{t("Grade")}</h2>
      <ol className="mt-2 grid grid-cols-3 gap-1.5" aria-label={t("Grades")}>
        {RANKS.map((r) => {
          const mine = r.label === rank.label;
          return (
            <li
              key={r.label}
              aria-current={mine ? "true" : undefined}
              className="flex items-center justify-center rounded-lg px-1 py-1.5 text-center text-xs font-medium leading-tight"
              style={
                mine
                  ? { backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }
                  : { backgroundColor: "var(--color-paper)", color: "var(--color-muted)" }
              }
            >
              {t(r.label)}
            </li>
          );
        })}
      </ol>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer font-medium" style={{ color: "var(--color-forest)" }}>{t("Comment ça marche ?")}</summary>
        <p className="mt-1 text-[var(--color-muted)]">
          {t("Ton grade dépend des Flèches gagnées au total : les dépenser ne le fait jamais baisser.")}
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {RANKS.map((r) => (
            <li key={r.label}>
              {t(r.min > 1 ? "{rank} : dès {n} Flèches" : "{rank} : dès {n} Flèche", { rank: t(r.label), n: r.min })}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Arrows({ arrows }: { arrows: NonNullable<ReturnType<typeof useMyArrows>> }) {
  const earned = arrows.total_arrows_earned;
  const { next, missing, progress } = rankFor(earned);
  const { streak } = arrows;
  const t = useT();
  const days = t(streak > 1 ? "{n} jours" : "{n} jour", { n: streak });

  return (
    <>
      <div>
        <p className="sw-eyebrow">{t("Tes Flèches")}</p>
        <p className="flex items-center gap-2 text-3xl font-medium tabular-nums" style={{ color: "var(--color-forest)" }}>
          <ArrowShotIcon className="h-7 w-7" /> {Math.max(0, arrows.current_arrows_balance)}
          <span className="text-sm font-normal text-[var(--color-muted)]">{t("disponibles")}</span>
        </p>
        <p className="text-sm text-[var(--color-muted)]">{t("{n} gagnées au total (elles fixent ton grade)", { n: earned })}</p>
      </div>

      {(arrows.golden_badge || arrows.early_access_until) && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t("Mes avantages")}>
          {arrows.golden_badge && (
            <li className="sw-badge" style={{ background: "#d4a017", color: "#2b1f00" }}>
              <StarIcon className="h-3.5 w-3.5" filled /> {t("Badge Doré")}
            </li>
          )}
          {arrows.early_access_until && (
            <li className="sw-badge" style={{ backgroundColor: "var(--color-lilac)", color: "var(--color-aubergine)" }}>
              {t("Avant-Première jusqu'au {date}", { date: formatDate(arrows.early_access_until) })}
            </li>
          )}
        </ul>
      )}

      <div>
        <div
          role="progressbar"
          aria-label={t("Progression vers le grade suivant")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="h-2.5 overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--color-border)" }}
        >
          <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, backgroundColor: "var(--color-forest)" }} />
        </div>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {next ? t("Encore {n} Flèches pour devenir {rank}", { n: missing, rank: t(next.label) }) : t("Grade le plus haut atteint, merci pour la communauté !")}
        </p>
      </div>

      <p className="flex items-start gap-2 text-sm">
        <FlameIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-aubergine)]" />
        <span>
          {streak === 0
            ? t("Aucune série en cours : partage ou réagis aujourd'hui.")
            : streak >= STREAK_DAYS
              ? <><strong>{t("Série : {days}", { days })}</strong> {t("· gains × 1,5")}</>
              : <><strong>{t("Série : {days}", { days })}</strong> {t("· × 1,5 à partir de {n} jours d'affilée", { n: STREAK_DAYS })}</>}
        </span>
      </p>
    </>
  );
}
