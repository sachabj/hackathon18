"use client";

// Historique des Flèches : une ligne par mouvement (hors gains des bons plans listés au-dessus).
import { useState } from "react";
import { ARROWS, ARROWS_NO_PLACE, DAILY_PAID_CREATIONS, DAILY_PAID_VOTES, KIND_LABELS, type ArrowLine } from "@/lib/arrows";
import { REFERRAL } from "@/lib/community";
import { NEARBY_M } from "@/lib/constants";

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
                <span className="font-medium">{KIND_LABELS[e.kind]}</span> ·{" "}
                {e.kind === "referral" ? "un ami actif" : e.kind === "welcome" ? "code parrainage" : (e.title ?? "offre supprimée")}
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
          <li>« J&apos;en ai profité » : +{ARROWS.confirm}.</li>
          <li>« Plus dispo » : +{ARROWS.report}, versées quand 3 étudiants l&apos;ont signalée.</li>
          <li>
            Pour une offre sur la carte, il faut partager ta position à moins de {NEARBY_M} m d&apos;elle : sinon aucune
            Flèche, et « Plus dispo » est refusé.
          </li>
          <li>
            Offre sans lieu précis : +{ARROWS_NO_PLACE.create} à la publication, +{ARROWS_NO_PLACE.bonus} aux 3
            confirmations, +{ARROWS_NO_PLACE.confirm} « J&apos;en ai profité », +{ARROWS_NO_PLACE.report} « Plus dispo ».
          </li>
          <li>3 jours d&apos;activité d&apos;affilée : gains × 1,5.</li>
          <li>Parrainage (depuis le Profil) : +{REFERRAL.referrer} par ami qui publie ou réagit.</li>
        </ul>
      </details>
    </section>
  );
}
