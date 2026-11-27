"use client";

// Fiche d'un bon plan : détail, fiabilité, votes et « J'y suis allé » (Justin).
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AuthorBadge from "@/components/AuthorBadge";
import CategoryIcon from "@/components/CategoryIcon";
import { LinkedText, OfferLink, RequirementBadges } from "@/components/deal/DealExtras";
import { CalendarIcon, CheckIcon, CloseIcon, NavigationIcon, PinIcon, ThumbsDownIcon, WalkIcon } from "@/components/icons";
import { CATEGORIES, ZONES } from "@/lib/constants";
import { directionsUrl } from "@/lib/directions";
import { fetchEngagement, recordView, setReaction, type Engagement, type Reaction } from "@/lib/engagement";
import { reliability, trustLevel } from "@/lib/rules";
import TrustBadge from "@/components/deal/TrustBadge";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Deal } from "@/lib/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

function ago(ms: number) {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `il y a ${hours} h` : `il y a ${Math.round(hours / 24)} j`;
}

export default function DealSheet({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const [data, setData] = useState<(Engagement & { at: number }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const category = CATEGORIES[deal.category];
  const where =
    deal.place_name ??
    (deal.scope === "national" ? "Partout en France" : ZONES.find((z) => z.id === deal.zone_id)?.name);

  useEffect(() => {
    recordView(deal);
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchEngagement(deal.id)
      .then((e) => !cancelled && setData({ ...e, at: Date.now() }))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [deal]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setData({ ...(await fetchEngagement(deal.id)), at: Date.now() });
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  const own = data?.userId === deal.author_id;
  const trust = data ? reliability(data.votes, data.at, data.trust) : null;
  const myVote = data?.votes.find((v) => v.user_id === data.userId)?.value;
  // « J'y suis allé » vaut confirmation : actif s'il y a un passage ou une confirmation (« C'est la même offre »).
  const reaction: Reaction = myVote === -1 ? "gone" : myVote === 1 || data?.visit?.mine ? "visited" : null;
  /** Recliquer sur la réaction active la décoche ; l'autre bouton la remplace. */
  function react(next: Exclude<Reaction, null>) {
    if (!data) return;
    act(() =>
      setReaction(deal.id, data.userId, reaction === next ? null : next, {
        vote: myVote,
        visited: !!data.visit?.mine,
        visitsAvailable: data.visit !== null,
      }),
    );
  }
  const reactStyle = (on: boolean, color: string, background: string) => ({
    borderColor: on ? color : "var(--color-border)",
    backgroundColor: on ? background : undefined,
    color: on ? color : "var(--color-ink)",
  });
  const voteClass = (on: boolean, color: string) =>
    `flex items-center justify-center gap-1.5 rounded-2xl border-2 py-2.5 text-sm font-medium disabled:opacity-50 ${on ? color : ""}`;

  // Dans <body> : la fiche doit passer au-dessus de la carte, de l'en-tête et de la barre du bas.
  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={deal.title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-4 pb-6"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)]">
            <CategoryIcon category={deal.category} size={22} /> {category.label}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mt-1 flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--color-paper)" }}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <AuthorBadge deal={deal} className="mb-2" />
        <h2 className="text-xl leading-snug">{deal.title}</h2>
        {deal.price_info && <p className="text-lg font-medium" style={{ color: "var(--color-forest)" }}>{deal.price_info}</p>}
        {deal.description && (
          <p className="mt-2 text-sm text-[var(--color-ink)]">
            <LinkedText text={deal.description} />
          </p>
        )}
        {(deal.requirements?.length ?? 0) > 0 && (
          <div className="mt-2">
            <p className="sr-only">Conditions :</p>
            <RequirementBadges requirements={deal.requirements} />
          </div>
        )}
        <p className="mt-2 flex flex-wrap gap-x-3 text-sm text-[var(--color-muted)]">
          {where && (
            <span className="flex items-center gap-1">
              <PinIcon className="h-3.5 w-3.5" /> {where}
            </span>
          )}
          {deal.deadline_at && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5" /> Date limite : {formatDate(deal.deadline_at)}
            </span>
          )}
          {deal.expires_at && <span>Jusqu&apos;au {formatDate(deal.expires_at)}</span>}
        </p>
        {deal.link_url && (
          <div className="mt-3">
            <OfferLink href={deal.link_url} large />
          </div>
        )}

        {trust && data && (
          <div className="mt-4 rounded-2xl p-3" style={{ backgroundColor: "var(--color-paper)" }}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
              <TrustBadge level={trustLevel(trust.score)} />
              {trust.score === null && <span>Pas encore de réaction</span>}
              {trust.lastConfirmedAt !== null && (
                <span>
                  Confirmé {ago(data.at - trust.lastConfirmedAt)} par {trust.confirmations} étudiant
                  {trust.confirmations > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {data.visit && (
              <p className="text-xs text-[var(--color-muted)]">
                {data.visit.count} étudiant{data.visit.count > 1 ? "s y sont allés" : " y est allé"}
              </p>
            )}
          </div>
        )}

        {/* Seulement pour une offre placée sur la carte (la fiche n'existe que dans le navigateur). */}
        {deal.lat !== null && deal.lng !== null && (
          <a
            href={directionsUrl({ lat: deal.lat, lng: deal.lng }, navigator.userAgent)}
            target="_blank"
            rel="noopener noreferrer"
            className="sw-btn-primary mt-3 w-full"
          >
            <NavigationIcon className="h-4 w-4" /> Y aller
          </a>
        )}

        {data && own && <p className="mt-3 text-sm text-[var(--color-muted)]">C&apos;est ton bon plan : tu suis ses réactions dans ton profil.</p>}
        {data && !own && (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                aria-pressed={reaction === "visited"}
                onClick={() => react("visited")}
                className={voteClass(reaction === "visited", "")}
                style={reactStyle(reaction === "visited", "var(--color-forest)", "var(--color-sage)")}
              >
                {reaction === "visited" ? <CheckIcon className="h-4 w-4" /> : <WalkIcon className="h-4 w-4" />} J&apos;y suis allé
              </button>
              <button
                type="button"
                disabled={busy}
                aria-pressed={reaction === "gone"}
                onClick={() => react("gone")}
                className={voteClass(reaction === "gone", "")}
                style={reactStyle(reaction === "gone", "var(--color-aubergine)", "var(--color-lilac)")}
              >
                {reaction === "gone" ? <CheckIcon className="h-4 w-4" /> : <ThumbsDownIcon className="h-4 w-4" />} Plus dispo
              </button>
            </div>
            {reaction && (
              <p className="mt-1.5 text-center text-xs text-[var(--color-muted)]">
                Touché par erreur ? Touche à nouveau pour décocher.
              </p>
            )}
          </>
        )}
        {!data && !error && <p className="mt-4 text-sm text-[var(--color-muted)]">Chargement…</p>}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
