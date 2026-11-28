"use client";

// Historique des Flèches : une ligne par mouvement (hors gains des bons plans listés au-dessus).
import { useState } from "react";
import { ARROWS, ARROWS_NO_PLACE, DAILY_PAID_CREATIONS, DAILY_PAID_VOTES, KIND_LABELS, type ArrowLine } from "@/lib/arrows";
import { REFERRAL } from "@/lib/community";
import { NEARBY_M } from "@/lib/constants";
import { dateLocale, useT } from "@/lib/i18n";

const SHOWN = 5;
const formatDate = (iso: string) => new Date(iso).toLocaleDateString(dateLocale(), { day: "numeric", month: "short" });

export default function ArrowHistory({ lines, todayVotes }: { lines: ArrowLine[]; todayVotes: number | null }) {
  const [all, setAll] = useState(false);
  const t = useT();

  return (
    <section aria-label={t("Historique des Flèches")}>
      <h2 className="text-lg">{t("Historique des Flèches")}</h2>
      {todayVotes !== null && (
        <p className="text-sm text-[var(--color-muted)]">
          {t("Votes récompensés aujourd'hui : {n} sur {max}.", { n: Math.min(todayVotes, DAILY_PAID_VOTES), max: DAILY_PAID_VOTES })}
        </p>
      )}
      {lines.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-muted)]">{t("Aucun vote récompensé ni échange pour l'instant.")}</p>
      ) : (
        <ul className="mt-1">
          {(all ? lines : lines.slice(0, SHOWN)).map((e) => (
            <li key={e.id} className="flex items-baseline gap-2 border-b py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
              <span className="w-14 shrink-0 text-xs text-[var(--color-muted)]">{formatDate(e.created_at)}</span>
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">{t(KIND_LABELS[e.kind])}</span> ·{" "}
                {e.kind === "referral" ? t("un ami actif") : e.kind === "welcome" ? t("code parrainage") : (e.title ?? t("offre supprimée"))}
              </span>
              <span
                className="shrink-0 font-medium tabular-nums"
                style={{ color: e.kind === "spend" ? "var(--color-aubergine)" : e.paid ? "var(--color-forest)" : "var(--color-muted)" }}
              >
                {e.kind === "spend" || e.amount === 0 ? e.amount : e.paid ? `+${e.amount}` : t("{n} en attente", { n: e.amount })}
              </span>
            </li>
          ))}
        </ul>
      )}
      {lines.length > SHOWN && (
        <button type="button" onClick={() => setAll(!all)} className="mt-2 text-sm font-medium underline" style={{ color: "var(--color-forest)" }}>
          {all ? t("Voir moins") : t("Voir tout ({n})", { n: lines.length })}
        </button>
      )}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-medium" style={{ color: "var(--color-forest)" }}>{t("Comment en gagner ?")}</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            {t("Partager un bon plan : +{a}, puis +{b} quand 3 étudiants le confirment ({n} publications récompensées par jour).", { a: ARROWS.create, b: ARROWS.bonus, n: DAILY_PAID_CREATIONS })}
          </li>
          <li>{t("« J'en ai profité » : +{n}.", { n: ARROWS.confirm })}</li>
          <li>{t("« Plus dispo » : +{n}, versées si l'offre est retirée (perdues si elle est sauvée).", { n: ARROWS.report })}</li>
          <li>
            {t("Pour une offre sur la carte, il faut partager ta position à moins de {m} m d'elle : sinon aucune Flèche, et « Plus dispo » est refusé.", { m: NEARBY_M })}
          </li>
          <li>
            {t("Offre sans lieu précis : +{a} à la publication, +{b} aux 3 confirmations, +{c} « J'en ai profité », +{d} « Plus dispo ».", { a: ARROWS_NO_PLACE.create, b: ARROWS_NO_PLACE.bonus, c: ARROWS_NO_PLACE.confirm, d: ARROWS_NO_PLACE.report })}
          </li>
          <li>{t("3 jours d'activité d'affilée : gains × 1,5.")}</li>
          <li>{t("Parrainage (depuis le Profil) : +{n} par ami qui publie ou réagit.", { n: REFERRAL.referrer })}</li>
        </ul>
      </details>
    </section>
  );
}
