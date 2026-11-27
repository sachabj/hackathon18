"use client";

// Onglet « Activité » : niveau d'activité (Justin), puis historique des Flèches.
import { useEffect, useState } from "react";
import ActivityCard from "@/components/profile/ActivityCard";
import { ARROWS, DAILY_PAID_CREATIONS, DAILY_PAID_VOTES, KIND_LABELS } from "@/lib/arrows";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { UserContribution } from "@/lib/types";
import { useMyArrows } from "@/lib/useMyArrows";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

async function fetchContributions() {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Session expirée : reconnecte-toi.");
  const { data, error } = await supabase.from("user_contributions").select("*").eq("user_id", user.id);
  if (error) throw new Error(error.message);
  return data as UserContribution[];
}

export default function ActivityPanel() {
  const arrows = useMyArrows();
  const [contributions, setContributions] = useState<UserContribution[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchContributions()
      .then((c) => !cancelled && setContributions(c))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!contributions && !error && <p className="text-sm text-[var(--color-muted)]">Chargement…</p>}
      {contributions && <ActivityCard contributions={contributions} />}

      {arrows && (
        <section aria-label="Historique des Flèches">
          <h2 className="text-lg">Historique des Flèches</h2>
          <p className="text-sm text-[var(--color-muted)]">
            Votes récompensés aujourd&apos;hui : {Math.min(arrows.today_votes, DAILY_PAID_VOTES)} sur {DAILY_PAID_VOTES}.
            {arrows.pending > 0 && ` En attente : ${arrows.pending} Flèches (signalements à corroborer).`}
          </p>
          {arrows.history.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--color-muted)]">Rien pour l&apos;instant : ta première Flèche est à un geste.</p>
          ) : (
            <ul className="mt-1">
              {arrows.history.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 border-b py-2" style={{ borderColor: "var(--color-border)" }}>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{KIND_LABELS[e.kind]}</span>
                    {e.kind === "create" && e.amount === 0 && (
                      <span className="block text-xs text-[var(--color-muted)]">
                        Au-delà de {DAILY_PAID_CREATIONS} publications ce jour-là : sans Flèches
                      </span>
                    )}
                    <span className="block truncate text-xs text-[var(--color-muted)]">
                      {formatDate(e.created_at)} · {e.title ?? "offre supprimée"}
                      {Number(e.multiplier) > 1 && " · série"}
                    </span>
                  </span>
                  <span
                    className="shrink-0 text-sm font-medium tabular-nums"
                    style={{ color: e.kind === "spend" ? "var(--color-aubergine)" : e.paid ? "var(--color-forest)" : "var(--color-muted)" }}
                  >
                    {e.kind === "spend" || e.amount === 0 ? e.amount : e.paid ? `+${e.amount}` : `${e.amount} en attente`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium" style={{ color: "var(--color-forest)" }}>Comment en gagner ?</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Partager un bon plan : +{ARROWS.create}, puis +{ARROWS.bonus} quand 3 étudiants le confirment
                ({DAILY_PAID_CREATIONS} publications récompensées par jour).
              </li>
              <li>« J&apos;y suis allé » : +{ARROWS.confirm}.</li>
              <li>« Plus dispo » : +{ARROWS.report}, versées quand 3 étudiants l&apos;ont signalée.</li>
              <li>Loin d&apos;une offre sur la carte : la moitié au-delà de 500 m, rien au-delà de 2 km.</li>
            </ul>
          </details>
        </section>
      )}
    </div>
  );
}
