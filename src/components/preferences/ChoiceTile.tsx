import { CheckIcon } from "@/components/icons";
import type { ReactNode } from "react";

/** Grande case à toucher du parcours de préférences. */
export default function ChoiceTile({
  icon,
  label,
  hint,
  badge,
  selected,
  row = false,
  onClick,
}: {
  /** Icône affichée dans la tuile (composant d'icône ou `<CategoryIcon/>`). */
  icon: ReactNode;
  label: string;
  hint?: string;
  badge?: number;
  selected: boolean;
  row?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`sw-card relative flex w-full items-center border-2 p-3 transition active:scale-95 ${
        row ? "gap-3 text-left" : "min-h-24 flex-col justify-center gap-1 text-center"
      } ${selected ? "border-[var(--color-forest)] bg-[var(--color-sage)]" : ""}`}
      style={selected ? undefined : { borderColor: "var(--color-border)" }}
    >
      <span className={selected ? "text-[var(--color-forest)]" : "text-[var(--color-muted)]"}>{icon}</span>
      <span className="min-w-0">
        <span className={`block text-sm font-medium ${selected ? "text-[var(--color-forest)]" : "text-[var(--color-ink)]"}`}>
          {label}
        </span>
        {hint && <span className="block text-xs text-[var(--color-muted)]">{hint}</span>}
      </span>
      {selected && (
        <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-forest)] px-1 text-xs font-bold text-[var(--color-surface)]">
          {badge ?? <CheckIcon className="h-3 w-3" />}
        </span>
      )}
    </button>
  );
}
