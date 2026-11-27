"use client";

// « Mon impact » (tâches 63 et 64) : ce que mes offres ont apporté aux autres. Les passages sont un total
// par offre (`my_deal_audience`) : un même étudiant venu sur deux offres compte deux fois.
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMyDeals } from "@/lib/engagement";
import { isSupabaseConfigured } from "@/lib/supabase/client";

type Impact = { deals: number; visits: number | null; confirmations: number | null };

export default function ImpactCard() {
  const [impact, setImpact] = useState<Impact | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Relu à chaque retour sur la page (Next conserve l'état).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchMyDeals()
      .then((mine) => {
        if (cancelled) return;
        const total = (key: "visits" | "confirmations") =>
          mine.stats && mine.deals.reduce((sum, d) => sum + (mine.stats?.[d.id]?.[key] ?? 0), 0);
        setImpact({ deals: mine.deals.length, visits: total("visits"), confirmations: total("confirmations") });
        setError(mine.statsError);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  const plural = (n: number | null, one: string, many: string) => (n !== null && n > 1 ? many : one);
  const tiles = impact
    ? [
        { value: impact.visits, label: plural(impact.visits, "passage sur tes offres", "passages sur tes offres") },
        { value: impact.deals, label: plural(impact.deals, "offre partagée", "offres partagées") },
        { value: impact.confirmations, label: plural(impact.confirmations, "confirmation reçue", "confirmations reçues") },
      ]
    : [];

  return (
    <section className="sw-card space-y-3 p-4" aria-label="Mon impact">
      <h2 className="text-lg">Mon impact</h2>
      {impact?.visits ? (
        <p className="font-medium" style={{ color: "var(--color-forest)" }}>
          Tes bons plans ont aidé des étudiants {impact.visits} fois. Merci !
        </p>
      ) : (
        impact && (
          <p className="text-sm text-[var(--color-muted)]">
            {impact.deals === 0 ? "Partage ton premier bon plan pour aider les autres." : "Personne n'est encore passé sur tes offres."}
          </p>
        )
      )}
      {impact && (
        <dl className="grid grid-cols-3 gap-2 text-center">
          {tiles.map((t) => (
            <div key={t.label} className="flex flex-col-reverse justify-end rounded-xl px-1 py-2" style={{ backgroundColor: "var(--color-paper)" }}>
              <dt className="text-xs leading-tight text-[var(--color-muted)]">{t.label}</dt>
              <dd className="text-2xl font-bold tabular-nums">{t.value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      )}
      {!impact && !error && <p className="text-sm text-[var(--color-muted)]">Chargement…</p>}
      {error && <p className="text-sm text-amber-700">Chiffres indisponibles. {error}</p>}
      {impact && impact.deals > 0 && (
        <Link href="/favoris?onglet=activite" className="block text-sm font-medium" style={{ color: "var(--color-forest)" }}>
          Voir mes bons plans ›
        </Link>
      )}
    </section>
  );
}
