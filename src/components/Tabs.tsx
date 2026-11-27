"use client";

// Onglets rectangulaires (accueil, Ciblés) : cases sur une ligne (égales, élargies si un mot ne tient pas), flèches du clavier.
import type { KeyboardEvent } from "react";

export default function Tabs<T extends string>({
  label,
  idPrefix,
  tabs,
  selected,
  onSelect,
}: {
  label: string;
  /** Les onglets ont l'id `<préfixe>-<id>` ; le panneau à relier doit avoir l'id `<préfixe>-panel`. */
  idPrefix: string;
  tabs: readonly { id: T; label: string }[];
  selected: T;
  onSelect: (id: T) => void;
}) {
  /** Au clavier : flèches, Début et Fin passent d'un onglet à l'autre. */
  function move(e: KeyboardEvent<HTMLDivElement>) {
    const i = tabs.findIndex((t) => t.id === selected);
    const keys: Record<string, number> = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = (keys[e.key] + tabs.length) % tabs.length;
    onSelect(tabs[next].id);
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next].focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={move}
      className="grid border-b-2"
      style={{ borderColor: "var(--color-forest)", gridTemplateColumns: `repeat(${tabs.length}, minmax(min-content, 1fr))` }}
    >
      {tabs.map((t) => {
        const on = selected === t.id;
        return (
          <button
            key={t.id}
            id={`${idPrefix}-${t.id}`}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={on ? 0 : -1}
            onClick={() => onSelect(t.id)}
            className="flex min-h-14 items-center justify-center rounded-t border border-b-0 px-0.5 py-1.5 text-center text-[11px] font-medium leading-tight min-[360px]:text-xs"
            style={
              on
                ? { borderColor: "var(--color-forest)", backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }
                : { borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-ink)" }
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
