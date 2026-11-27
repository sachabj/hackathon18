"use client";

import { useState } from "react";
import { METRICS, type Metric, type summarize } from "@/lib/offerStats";

type Row = ReturnType<typeof summarize>["rows"][number];

/** Barres horizontales : une mesure à la fois, offres classées de la plus forte à la plus faible. */
export default function OfferChart({ rows }: { rows: Row[] }) {
  const [metric, setMetric] = useState<Metric>("favorites");
  const [active, setActive] = useState<string | null>(null);
  const sorted = [...rows].sort((a, b) => b[metric] - a[metric]);
  const max = Math.max(1, ...rows.map((r) => r[metric]));

  return (
    <div>
      <div className="grid grid-cols-3 rounded-full p-1 text-xs font-medium" style={{ backgroundColor: "var(--color-paper)" }}>
        {(Object.keys(METRICS) as Metric[]).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={metric === m}
            onClick={() => setMetric(m)}
            className="rounded-full py-2"
            style={metric === m ? { backgroundColor: "var(--color-surface)", color: "var(--color-ink)", boxShadow: "0 1px 3px rgb(0 0 0 / 0.1)" } : { color: "var(--color-muted)" }}
          >
            {METRICS[m].label}
          </button>
        ))}
      </div>

      <ul className="mt-3 space-y-1">
        {sorted.map((r) => (
          <li key={r.offer.id}>
            <button
              type="button"
              aria-expanded={active === r.offer.id}
              onClick={() => setActive(active === r.offer.id ? null : r.offer.id)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setActive(r.offer.id)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
              className="w-full rounded-lg px-1 py-1.5 text-left"
            >
              <span className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate text-[var(--color-ink)]">
                  {r.offer.title}
                  {!r.online && <span className="text-[var(--color-muted)]"> · hors ligne</span>}
                </span>
                <span className="font-medium tabular-nums">{r[metric]}</span>
              </span>
              {/* Barre fine, ancrée à gauche, arrondie à son extrémité. */}
              <span aria-hidden className="mt-1 block h-2.5 border-l" style={{ borderColor: "var(--color-border)" }}>
                <span
                  className="block h-full rounded-r-[4px]"
                  style={{ width: `${(r[metric] / max) * 100}%`, backgroundColor: "var(--color-forest)" }}
                />
              </span>
              {active === r.offer.id && (
                <span className="mt-1 block text-xs text-[var(--color-muted)]">
                  {(Object.keys(METRICS) as Metric[])
                    .map((m) => `${r[m]} ${METRICS[m].label.toLowerCase()}`)
                    .join(" · ")}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
