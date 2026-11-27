"use client";

// Haut de la page « Ciblés » : Flèches (solde, rang, progression, série) et influence (Matteo), en une carte.
import { useEffect, useState } from "react";
import { ArrowShotIcon, FlameIcon, StarIcon } from "@/components/icons";
import InfluenceBlock from "@/components/profile/InfluenceCard";
import { rankFor, STREAK_DAYS } from "@/lib/arrows";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchMyInfluence, type Influence } from "@/lib/trust";
import { useMyArrows } from "@/lib/useMyArrows";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

export default function ArrowsCard() {
  const arrows = useMyArrows();
  const [influence, setInfluence] = useState<Influence | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchMyInfluence().then((i) => !cancelled && setInfluence(i));
    return () => {
      cancelled = true;
    };
  }, []);

  // Sans les migrations 016 (Flèches) et 014 (influence), rien à montrer.
  if (!arrows && !influence) return null;

  return (
    <section className="sw-card space-y-3 p-4" aria-label="Mes Flèches">
      {arrows && <Arrows arrows={arrows} />}
      {influence && (
        <div className={arrows ? "border-t pt-3" : undefined} style={{ borderColor: "var(--color-border)" }}>
          <InfluenceBlock me={influence} />
        </div>
      )}
    </section>
  );
}

function Arrows({ arrows }: { arrows: NonNullable<ReturnType<typeof useMyArrows>> }) {
  const earned = arrows.total_arrows_earned;
  const { rank, next, missing, progress } = rankFor(earned);
  const { streak } = arrows;
  const days = `${streak} jour${streak > 1 ? "s" : ""}`;

  return (
    <>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="sw-eyebrow">Tes Flèches</p>
          <span className="sw-badge whitespace-nowrap" style={{ backgroundColor: "var(--color-aubergine)", color: "var(--color-surface)" }}>
            {rank.label}
          </span>
        </div>
        <p className="flex items-center gap-2 text-3xl font-medium tabular-nums" style={{ color: "var(--color-forest)" }}>
          <ArrowShotIcon className="h-7 w-7" /> {Math.max(0, arrows.current_arrows_balance)}
          <span className="text-sm font-normal text-[var(--color-muted)]">disponibles</span>
        </p>
        <p className="text-sm text-[var(--color-muted)]">{earned} gagnées au total (elles fixent ton rang)</p>
      </div>

      {(arrows.golden_badge || arrows.early_access_until) && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Mes avantages">
          {arrows.golden_badge && (
            <li className="sw-badge" style={{ background: "#d4a017", color: "#2b1f00" }}>
              <StarIcon className="h-3.5 w-3.5" filled /> Badge Doré
            </li>
          )}
          {arrows.early_access_until && (
            <li className="sw-badge" style={{ backgroundColor: "var(--color-lilac)", color: "var(--color-aubergine)" }}>
              Avant-Première jusqu&apos;au {formatDate(arrows.early_access_until)}
            </li>
          )}
        </ul>
      )}

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
    </>
  );
}
