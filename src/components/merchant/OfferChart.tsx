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
      <div className="grid grid-cols-3 rounded-full bg-zinc-100 p-1 text-xs font-semibold">
        {(Object.keys(METRICS) as Metric[]).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={metric === m}
            onClick={() => setMetric(m)}
            className={`rounded-full py-2 ${metric === m ? "bg-white text-zinc-900 shadow" : "text-zinc-500"}`}
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
              className="w-full rounded-lg px-1 py-1.5 text-left hover:bg-zinc-50"
            >
              <span className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate text-zinc-700">
                  {r.offer.title}
                  {!r.online && <span className="text-zinc-400"> · hors ligne</span>}
                </span>
                <span className="font-semibold tabular-nums text-zinc-900">{r[metric]}</span>
              </span>
              {/* Barre fine, ancrée à gauche, arrondie à son extrémité. */}
              <span aria-hidden className="mt-1 block h-2.5 border-l border-zinc-300">
                <span
                  className="block h-full rounded-r-[4px] bg-[#2a78d6]"
                  style={{ width: `${(r[metric] / max) * 100}%` }}
                />
              </span>
              {active === r.offer.id && (
                <span className="mt-1 block text-xs text-zinc-500">
                  {(Object.keys(METRICS) as Metric[])
                    .map((m) => `${METRICS[m].emoji} ${r[m]} ${METRICS[m].label.toLowerCase()}`)
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
