"use client";

// Réactions d'un bon plan (tâches 29 et 35) : « J'en ai profité (n) » / « Plus dispo (n) », sur la carte et dans la fiche.
// Exclusives ; toucher la réaction active la décoche. Sur son propre bon plan : compteurs seuls.
// Tâche 75 : le bouton choisi rebondit et le compteur défile vers sa nouvelle valeur.
import type { ComponentType } from "react";
import { ArrowShotIcon, CheckIcon, ThumbsDownIcon, WalkIcon } from "@/components/icons";
import { arrowsFor } from "@/lib/arrows";
import type { Reaction } from "@/lib/engagement";
import { useChanges } from "@/lib/motion";
import { useT } from "@/lib/i18n";

export default function ReactionBar({
  counts,
  reaction,
  busy = false,
  own = false,
  onReact,
  size = "md",
  showGain = true,
  placed,
}: {
  counts: { visited: number; gone: number };
  reaction: Reaction;
  busy?: boolean;
  /** Son propre bon plan : on ne réagit pas, on voit seulement les chiffres. */
  own?: boolean;
  onReact: (next: Exclude<Reaction, null>) => void;
  size?: "sm" | "md";
  /** Gain à côté du libellé (retiré dans la petite fenêtre de la carte). */
  showGain?: boolean;
  /** Offre placée sur la carte : le gain, plus élevé, suppose d'être sur place. */
  placed: boolean;
}) {
  const t = useT();
  const gains = arrowsFor(placed);
  const buttons = [
    { id: "visited" as const, label: t("J'en ai profité"), count: counts.visited, gain: gains.confirm, Icon: WalkIcon, color: "var(--color-forest)", bg: "var(--color-sage)" },
    { id: "gone" as const, label: t("Plus dispo"), count: counts.gone, gain: gains.report, Icon: ThumbsDownIcon, color: "var(--color-aubergine)", bg: "var(--color-lilac)" },
  ];
  const pad = size === "sm" ? "px-1 py-1.5 text-[13px]" : "py-2.5 text-sm";
  return (
    <div className="grid grid-cols-2 gap-2">
      {buttons.map((b) => (
        <ReactionButton
          key={b.id}
          {...b}
          on={reaction === b.id}
          busy={busy}
          own={own}
          pad={pad}
          showGain={showGain}
          onClick={() => onReact(b.id)}
        />
      ))}
    </div>
  );
}

function ReactionButton({
  label,
  count,
  gain,
  Icon,
  color,
  bg,
  on,
  busy,
  own,
  pad,
  showGain,
  onClick,
}: {
  label: string;
  count: number;
  gain: number;
  Icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  on: boolean;
  busy: boolean;
  own: boolean;
  pad: string;
  showGain: boolean;
  onClick: () => void;
}) {
  const t = useT();
  // Rebond seulement quand le bouton devient actif, pas au premier affichage.
  const toggled = useChanges(on);
  const counted = useChanges(count);
  return (
    <button
      type="button"
      disabled={busy || own}
      aria-pressed={own ? undefined : on}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex items-center justify-center rounded-2xl border-2 font-medium transition active:scale-95 disabled:active:scale-100 ${pad} ${busy ? "opacity-60" : ""}`}
      style={{
        borderColor: on ? color : "var(--color-border)",
        backgroundColor: on ? bg : undefined,
        color: on || own ? color : "var(--color-ink)",
      }}
    >
      <span
        key={toggled.count}
        className={`flex flex-wrap items-center justify-center gap-x-1.5 ${toggled.count > 0 && on ? "sw-pop" : ""}`}
      >
        {on ? <CheckIcon className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        {label}
        <span className="inline-flex overflow-hidden tabular-nums opacity-80">
          (
          <span
            key={counted.count}
            className={counted.count === 0 ? "" : count > counted.prev ? "sw-roll-up" : "sw-roll-down"}
          >
            {count}
          </span>
          )
        </span>
        {showGain && !own && !on && (
          <span className="flex items-center gap-0.5 text-xs tabular-nums" style={{ color: "var(--color-forest)" }}>
            +{gain}
            <ArrowShotIcon className="h-3 w-3" />
            <span className="sr-only">{t("Flèches")}</span>
          </span>
        )}
      </span>
    </button>
  );
}
