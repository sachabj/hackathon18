"use client";

// Rang d'influence de l'étudiant (tâche 33), comme les niveaux Waze : visible par lui seul.
import { useEffect, useState } from "react";
import { CheckBadgeIcon } from "@/components/icons";
import { INFLUENCE_RANKS, influenceRank } from "@/lib/rules";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchMyInfluence, type Influence } from "@/lib/trust";

export default function InfluenceCard() {
  const [me, setMe] = useState<Influence | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchMyInfluence().then((i) => !cancelled && setMe(i));
    return () => {
      cancelled = true;
    };
  }, []);

  // Sans la migration 014, rien à montrer.
  if (!me) return null;
  const rank = influenceRank(me.weight);
  const step = INFLUENCE_RANKS.findIndex((r) => r.id === rank.id);
  const tips = [
    me.account_days < 3 && "Ton compte est tout neuf : ton avis comptera pleinement dans quelques jours.",
    me.contributions_30d < 20 && "Réagis aux offres (« J'y suis allé », « Plus dispo ») et partage des bons plans.",
    me.judged >= 3 && me.accuracy < 0.6 && "Plusieurs de tes avis ont été contredits : ne réagis que si tu as vérifié sur place.",
  ].filter(Boolean) as string[];

  return (
    <section className="sw-card p-4">
      <p className="sw-eyebrow">Ton influence</p>
      <div className="mt-1 flex items-center gap-2">
        <CheckBadgeIcon className="h-6 w-6 text-[var(--color-forest)]" />
        <h2 className="text-xl">{rank.label}</h2>
      </div>
      {/* Paliers : Débutant → Confirmé → Expert */}
      <ol className="mt-3 grid grid-cols-3 gap-1.5" aria-label="Paliers">
        {[...INFLUENCE_RANKS].reverse().map((r) => {
          const reached = INFLUENCE_RANKS.findIndex((x) => x.id === r.id) >= step;
          return (
            <li
              key={r.id}
              className="rounded-full py-1 text-center text-xs font-medium"
              style={
                reached
                  ? { backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }
                  : { backgroundColor: "var(--color-paper)", color: "var(--color-muted)" }
              }
            >
              {r.label}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-[var(--color-muted)]">
        Comme sur Waze, l&apos;avis des étudiants fiables pèse plus lourd : il dépend de l&apos;ancienneté de ton compte, de
        ton activité sur 30 jours et de la justesse de tes réactions
        {me.judged > 0 && ` (${me.judged} avis comparés à ceux des autres)`}.
      </p>
      {tips.length > 0 && rank.id !== "expert" && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
