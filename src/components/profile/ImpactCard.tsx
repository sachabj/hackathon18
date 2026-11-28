"use client";

// Étudiants aidés (migration 022) : chaque personne compte une fois ; le détail s'ouvre au toucher.
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDownIcon, SparklesIcon } from "@/components/icons";
import { onArrows } from "@/lib/arrows";
import { fetchImpact, type Impact } from "@/lib/community";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`;

export default function ImpactCard() {
  const [impact, setImpact] = useState<Impact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Relu à chaque retour sur la page (Next conserve l'état).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    const load = () =>
      fetchImpact()
        .then((i) => !cancelled && setImpact(i))
        .catch((e: Error) => !cancelled && setError(e.message));
    load();
    const stop = onArrows(load);
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  if (error) return <p className="text-sm text-amber-700">Impact indisponible. {error}</p>;
  // Sans la migration 022 : rien à montrer.
  if (!impact) return null;
  const n = impact.people_helped;
  const details = [
    ["Ont confirmé un de tes bons plans", impact.validations],
    ["L'ont mis en favori", impact.favorites],
    ["Ont touché « Y aller »", impact.directions],
    ["Ont ouvert un lien partagé", impact.shares],
  ] as const;

  return (
    <section aria-label="Mon impact" className="rounded-2xl p-4" style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="impact-detail" className="flex w-full items-center gap-3 text-left">
        <SparklesIcon className="h-8 w-8 shrink-0 text-[var(--color-sage)]" />
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-lg leading-snug">
            {n > 0 ? (
              <>
                Tu as déjà aidé <strong className="text-2xl">{plural(n, "étudiant")}</strong> à économiser !
              </>
            ) : (
              "Aide ton premier étudiant à économiser"
            )}
          </span>
          <span className="mt-1 block text-sm" style={{ color: "var(--color-sage)" }}>
            {n > 0
              ? `${impact.via_deals} grâce à tes bons plans · ${impact.via_shares} grâce à tes partages`
              : "Partage un bon plan : chaque étudiant qui s'en sert compte."}
          </span>
        </span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {impact.reports_confirmed > 0 && (
        <p className="mt-2 text-sm">
          Et {plural(impact.reports_confirmed, "signalement « Plus dispo » confirmé", "signalements « Plus dispo » confirmés")} : des déplacements inutiles évités.
        </p>
      )}
      {open && (
        <div id="impact-detail" className="mt-3 space-y-2 border-t pt-3 text-sm" style={{ borderColor: "color-mix(in srgb, var(--color-surface) 25%, transparent)" }}>
          <dl className="space-y-1">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt>{label}</dt>
                <dd className="font-bold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs" style={{ color: "var(--color-sage)" }}>
            Une même personne ne compte qu&apos;une fois dans le total.
          </p>
          <Link href="/publier" className="inline-block font-medium underline">
            Partager un bon plan
          </Link>
        </div>
      )}
    </section>
  );
}
