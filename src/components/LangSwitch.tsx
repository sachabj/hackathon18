"use client";

// Choix de la langue (tâche 50) : FR / EN, retenu sur l'appareil.
import { setLang, useLang, useT, type Lang } from "@/lib/i18n";

const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: "fr", label: "FR", name: "Français" },
  { id: "en", label: "EN", name: "English" },
];

export default function LangSwitch({ full = false }: { full?: boolean }) {
  const lang = useLang();
  const t = useT();
  return (
    <div role="group" aria-label={t("Langue")} className="inline-flex overflow-hidden rounded-full border" style={{ borderColor: "var(--color-border)" }}>
      {LANGS.map((l) => {
        const on = l.id === lang;
        return (
          <button
            key={l.id}
            type="button"
            lang={l.id}
            aria-pressed={on}
            onClick={() => !on && setLang(l.id)}
            className={`px-3 py-1 text-sm font-medium ${full ? "min-w-24" : ""}`}
            style={on ? { backgroundColor: "var(--color-forest)", color: "var(--color-surface)" } : { color: "var(--color-ink)" }}
          >
            {full ? l.name : l.label}
          </button>
        );
      })}
    </div>
  );
}
