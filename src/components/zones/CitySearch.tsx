"use client";

// Recherche d'une ville de France (Photon), avec des raccourcis. Renvoie la zone correspondante (migration 027).
import { useEffect, useRef, useState } from "react";
import { PinIcon, SearchIcon } from "@/components/icons";
import { ZONES } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { ensureZone, searchCities, STUDENT_CITIES, type City, type Zone } from "@/lib/zones";

export default function CitySearch({
  onChoose,
  exclude = [],
  label,
  suggestions = true,
}: {
  onChoose: (zone: Zone) => void;
  /** Villes déjà choisies : pas reproposées en raccourci */
  exclude?: string[];
  label: string;
  suggestions?: boolean;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  // Recherche pendant la frappe, après une courte pause.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = setTimeout(async () => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      try {
        const found = await searchCities(q, controller.signal);
        setResults(found);
        setError(found.length === 0 ? t("Aucune ville de France trouvée.") : null);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError(t((e as Error).message));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, t]);

  async function choose(city: City | Zone) {
    setBusy(true);
    setError(null);
    try {
      onChoose("department" in city ? await ensureZone(city) : city);
      setQuery("");
      setResults(null);
    } catch (e) {
      setError(t((e as Error).message));
    }
    setBusy(false);
  }

  const shortcuts: (City | Zone)[] = [...ZONES, ...STUDENT_CITIES].filter(
    (c) => !exclude.some((id) => id === ("id" in c ? c.id : "") || id.startsWith(c.name.toLowerCase())),
  );
  const shown = query.trim().length >= 2 ? results : null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label}
        <span className="relative mt-1 block">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            className="sw-field"
            style={{ paddingLeft: "2.25rem" }}
            type="search"
            enterKeyHint="search"
            autoComplete="address-level2"
            placeholder={t("Ex : Lyon, Brest, Pau…")}
            value={query}
            disabled={busy}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (shown?.[0]) choose(shown[0]);
              }
            }}
          />
        </span>
      </label>
      {shown && shown.length > 0 && (
        <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
          {shown.map((c) => (
            <li key={`${c.name}|${c.department}`}>
              <button type="button" disabled={busy} onClick={() => choose(c)} className="flex w-full items-center gap-2 px-3 py-2 text-left">
                <PinIcon className="h-4 w-4 shrink-0 text-[var(--color-forest)]" />
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-[var(--color-muted)]">{[c.county, c.department].filter(Boolean).join(" · ")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {suggestions && !shown && (
        <div className="flex flex-wrap gap-1.5" aria-label={t("Villes proposées")}>
          {shortcuts.map((c) => (
            <button
              key={"id" in c ? c.id : c.name}
              type="button"
              disabled={busy}
              onClick={() => choose(c)}
              className="rounded-full border px-3 py-1 text-sm disabled:opacity-50"
              style={{ borderColor: "var(--color-border)" }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
