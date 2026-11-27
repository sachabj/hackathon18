"use client";

// Historique des Flèches : une ligne par mouvement (hors gains des bons plans listés au-dessus).
import { useState } from "react";
import { ARROWS, DAILY_PAID_CREATIONS, DAILY_PAID_VOTES, KIND_LABELS, type ArrowLine } from "@/lib/arrows";

const SHOWN = 5;
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

export default function ArrowHistory({ lines, todayVotes }: { lines: ArrowLine[]; todayVotes: number | null }) {
  const [all, setAll] = useState(false);

  return (
    <section aria-label="Historique des Flèches">
      <h2 className="text-lg">Historique des Flèches</h2>
      {todayVotes !== null && (
        <p className="text-sm text-[var(--color-muted)]">
          Votes récompensés aujourd&apos;hui : {Math.min(todayVotes, DAILY_PAID_VOTES)} sur {DAILY_PAID_VOTES}.
        </p>
      )}
      {lines.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-muted)]">Aucun vote récompensé ni échange pour l&apos;instant.</p>
      ) : (
        <ul className="mt-1">
          {(all ? lines : lines.slice(0, SHOWN)).map((e) => (
            <li key={e.id} className="flex items-baseline gap-2 border-b py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
              <span className="w-14 shrink-0 text-xs text-[var(--color-muted)]">{formatDate(e.created_at)}</span>
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">{KIND_LABELS[e.kind]}</span> · {e.title ?? "offre supprimée"}
              </span>
              <span
                className="shrink-0 font-medium tabular-nums"
                style={{ color: e.kind === "spend" ? "var(--color-aubergine)" : e.paid ? "var(--color-forest)" : "var(--color-muted)" }}
              >
                {e.kind === "spend" || e.amount === 0 ? e.amount : e.paid ? `+${e.amount}` : `${e.amount} en attente`}
              </span>
            </li>
          ))}
        </ul>
      )}
      {lines.length > SHOWN && (
        <button type="button" onClick={() => setAll(!all)} className="mt-2 text-sm font-medium underline" style={{ color: "var(--color-forest)" }}>
          {all ? "Voir moins" : `Voir tout (${lines.length})`}
        </button>
      )}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-medium" style={{ color: "var(--color-forest)" }}>Comment en gagner ?</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Partager un bon plan : +{ARROWS.create}, puis +{ARROWS.bonus} quand 3 étudiants le confirment (
            {DAILY_PAID_CREATIONS} publications récompensées par jour).
          </li>
          <li>« J&apos;y suis allé » : +{ARROWS.confirm}.</li>
          <li>« Plus dispo » : +{ARROWS.report}, versées quand 3 étudiants l&apos;ont signalée.</li>
          <li>3 jours d&apos;activité d&apos;affilée : gains × 1,5.</li>
          <li>Loin d&apos;une offre sur la carte : la moitié au-delà de 500 m, rien au-delà de 2 km.</li>
        </ul>
      </details>
    </section>
  );
}
