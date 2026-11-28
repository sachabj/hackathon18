"use client";

// Notification « Tu es près de… : toujours dispo ? » (tâche 11), affichée par-dessus toute l'application.
// Déclenchée par « Simuler ma position » (profil) ; la réaction est une réaction normale (vraie position).
import Link from "next/link";
import { useEffect, useState } from "react";
import ReactionBar from "@/components/deal/ReactionBar";
import { BellIcon, CloseIcon, PinIcon } from "@/components/icons";
import { announceReactions, fetchEngagement, setReaction, type Engagement, type Reaction } from "@/lib/engagement";
import { onNearby } from "@/lib/nearby";
import { recentCounts } from "@/lib/rules";
import type { Deal } from "@/lib/types";
import { useT } from "@/lib/i18n";

export default function NearbyPrompt() {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [data, setData] = useState<(Engagement & { at: number }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      onNearby((d) => {
        setDeal(d);
        setData(null);
        setError(null);
        fetchEngagement(d.id)
          .then((e) => setData({ ...e, at: Date.now() }))
          .catch((e: Error) => setError(e.message));
      }),
    [],
  );

  const t = useT();
  if (!deal) return null;
  const close = () => setDeal(null);
  const myVote = data?.votes.find((v) => v.user_id === data.userId)?.value;
  const reaction: Reaction = myVote === -1 ? "gone" : myVote === 1 || data?.visit?.mine ? "visited" : null;

  async function react(next: Exclude<Reaction, null>) {
    if (!data || !deal) return;
    setBusy(true);
    setError(null);
    try {
      await setReaction(deal.id, data.userId, reaction === next ? null : next, {
        vote: myVote,
        visited: !!data.visit?.mine,
        visitsAvailable: data.visit !== null,
        placed: deal.lat !== null && deal.lng !== null,
      });
      const fresh = await fetchEngagement(deal.id);
      announceReactions({ dealId: deal.id, votes: fresh.votes, trust: fresh.trust, state: fresh.state });
      // Le message des Flèches confirme la réaction : la notification disparaît.
      close();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[2150] flex justify-center px-3 lg:top-20">
      <section
        role="alertdialog"
        aria-label={t("Notification sur place")}
        className="sw-card sw-toast pointer-events-auto w-full max-w-sm space-y-3 p-4 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <BellIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-forest)]" />
          <div className="min-w-0 flex-1">
            <p className="sw-eyebrow">{t("Notification (démo)")}</p>
            <p className="flex items-center gap-1 text-sm text-[var(--color-muted)]">
              <PinIcon className="h-3.5 w-3.5 shrink-0" /> {t("Tu es près de {place}", { place: deal.place_name ?? t("ce bon plan") })}
            </p>
            <p className="mt-1 font-medium leading-snug">{t("« {title} » est toujours dispo ?", { title: deal.title })}</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t("Fermer la notification")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--color-paper)" }}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        {data ? (
          <ReactionBar
            size="sm"
            counts={recentCounts(data.votes, data.at)}
            reaction={reaction}
            busy={busy}
            own={data.userId === deal.author_id}
            onReact={react}
            placed={deal.lat !== null && deal.lng !== null}
          />
        ) : (
          !error && <p className="text-sm text-[var(--color-muted)]">{t("Chargement…")}</p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <p className="text-xs text-[var(--color-muted)]">
          {t("Flèches et « Plus dispo » seulement si ta vraie position est à moins de 500 m.")}{" "}
          <Link href="/publier" onClick={close} className="font-medium underline" style={{ color: "var(--color-forest)" }}>
            {t("Un autre bon plan ici ?")}
          </Link>
        </p>
      </section>
    </div>
  );
}
