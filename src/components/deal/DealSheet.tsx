"use client";

// Fiche d'un bon plan : détail, fiabilité, votes et « J'en ai profité » (Justin).
import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { createPortal } from "react-dom";
import AuthorBadge from "@/components/AuthorBadge";
import CategoryIcon from "@/components/CategoryIcon";
import { LinkedText, OfferLink, RequirementBadges } from "@/components/deal/DealExtras";
import ReactionBar from "@/components/deal/ReactionBar";
import ShareButton from "@/components/deal/ShareButton";
import DealLocationNote from "@/components/location/DealLocationNote";
import { CalendarIcon, CameraIcon, CloseIcon, NavigationIcon, PinIcon } from "@/components/icons";
import { recordDirections } from "@/lib/community";
import { CATEGORIES, ZONES } from "@/lib/constants";
import { directionsUrl } from "@/lib/directions";
import { fetchEngagement, recordView, setReaction, type Engagement, type Reaction, type Reactions } from "@/lib/engagement";
import { isOwnPhotoUrl } from "@/lib/photos";
import {
  activeReports,
  DOUBT_REPORTS,
  doubtStatus,
  recentCounts,
  reliability,
  RESCUE_CONFIRMATIONS,
  trustLevel,
} from "@/lib/rules";
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

export default function DealSheet({
  deal,
  onClose,
  onReactionsChange,
}: {
  deal: Deal;
  onClose: () => void;
  /** Prévient la carte du fil après une réaction dans la fiche, pour qu'elle affiche les mêmes chiffres. */
  onReactionsChange?: (r: Reactions) => void;
}) {
  const [data, setData] = useState<(Engagement & { at: number }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(false);
  const photo = isOwnPhotoUrl(deal.photo_url) ? deal.photo_url : null;
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

  // Tâche 75 : la fiche redescend (téléphone) ou s'efface (ordinateur) avant d'être fermée.
  const panel = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const el = panel.current;
    if (!el || prefersReducedMotion() || typeof el.animate !== "function") return onClose();
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    const from = getComputedStyle(el).transform;
    const start = from === "none" ? "translateY(0)" : from;
    const frames = wide
      ? [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(8px) scale(0.96)" }]
      : [{ transform: start }, { transform: "translateY(100%)" }];
    backdrop.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" });
    el.animate(frames, { duration: wide ? 160 : 220, easing: "ease-in", fill: "forwards" }).finished.then(onClose, onClose);
  }, [onClose]);

  // Glisser la poignée vers le bas (téléphone) : au-delà de 100 px ou d'un geste rapide, la fiche se ferme.
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null);
  const onDragStart = (e: React.PointerEvent) => {
    drag.current = { y: e.clientY, t: e.timeStamp, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (panel.current) panel.current.style.transition = "none";
  };
  const onDragMove = (e: React.PointerEvent) => {
    if (!drag.current || !panel.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    panel.current.style.transform = `translateY(${drag.current.dy}px)`;
  };
  const onDragEnd = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    const el = panel.current;
    if (!d || !el) return;
    const speed = d.dy / Math.max(1, e.timeStamp - d.t);
    if (d.dy > 100 || (d.dy > 30 && speed > 0.6)) return close();
    el.style.transition = "transform 0.2s ease-out";
    el.style.transform = "";
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      const fresh = await fetchEngagement(deal.id);
      setData({ ...fresh, at: Date.now() });
      onReactionsChange?.({ votes: fresh.votes, trust: fresh.trust, state: fresh.state });
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  const own = data?.userId === deal.author_id;
  const trust = data ? reliability(data.votes, data.at, data.trust) : null;
  /** État relu après chaque réaction (douteuse, retirée). */
  const state = data?.state ?? deal;
  const doubt = data ? doubtStatus(state, data.votes) : null;
  const reports = data ? activeReports(state, data.votes) : 0;
  const myVote = data?.votes.find((v) => v.user_id === data.userId)?.value;
  // « J'en ai profité » vaut confirmation : actif s'il y a un passage ou une confirmation (« C'est la même offre »).
  const reaction: Reaction = myVote === -1 ? "gone" : myVote === 1 || data?.visit?.mine ? "visited" : null;
  /** Recliquer sur la réaction active la décoche ; l'autre bouton la remplace. */
  function react(next: Exclude<Reaction, null>) {
    if (!data) return;
    act(() =>
      setReaction(deal.id, data.userId, reaction === next ? null : next, {
        vote: myVote,
        visited: !!data.visit?.mine,
        visitsAvailable: data.visit !== null,
        placed: deal.lat !== null && deal.lng !== null,
      }),
    );
  }
  // Dans <body> : la fiche doit passer au-dessus de la carte, de l'en-tête et de la barre du bas.
  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-end justify-center lg:items-center lg:p-6" onClick={close}>
      <div ref={backdrop} aria-hidden className="sw-fade-in absolute inset-0 bg-black/40" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={deal.title}
        onClick={(e) => e.stopPropagation()}
        className="sw-sheet-in relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-4 pb-6 pt-0 lg:rounded-3xl lg:max-w-lg lg:pt-4"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        {/* Poignée (téléphone) : la faire glisser vers le bas ferme la fiche. */}
        <div
          aria-hidden
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          className="sticky top-0 z-10 -mx-4 flex cursor-grab touch-none justify-center pb-2 pt-2.5 lg:hidden"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <span className="h-1.5 w-10 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
        </div>
        <div className="flex items-start justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)]">
            <CategoryIcon category={deal.category} size={22} /> {category.label}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="-mt-1 flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--color-paper)" }}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <AuthorBadge deal={deal} className="mb-2" />
        <h2 className="text-xl leading-snug">{deal.title}</h2>
        {deal.description && (
          <p className="mt-2 text-sm text-[var(--color-ink)]">
            <LinkedText text={deal.description} />
          </p>
        )}
        {/* Photo de preuve (Matteo) : miniature, en grand au toucher. */}
        {photo && (
          <button type="button" onClick={() => setZoom(true)} className="mt-2 flex items-center gap-2 text-left">
            {/* eslint-disable-next-line @next/next/no-img-element -- image du stockage Supabase */}
            <img src={photo} alt="Photo de l'offre" loading="lazy" className="h-16 w-16 rounded-lg border object-cover" style={{ borderColor: "var(--color-border)" }} />
            <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
              <CameraIcon className="h-3.5 w-3.5" /> Photo prise sur place
            </span>
          </button>
        )}
        {zoom && photo && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Photo de l'offre"
            onClick={() => setZoom(false)}
            className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/80 p-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- image du stockage Supabase */}
            <img src={photo} alt="Photo de l'offre" className="max-h-full max-w-full rounded-xl" />
            <button type="button" className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm font-medium">
              <CloseIcon className="h-3.5 w-3.5" /> Fermer
            </button>
          </div>
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
        {deal.source_name && (
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Source : {deal.source_name}
            {deal.source_checked_at && `, vérifiée le ${formatDate(deal.source_checked_at)}`}. Conditions à confirmer sur la page de
            la source.
          </p>
        )}

        {trust && data && (
          <div className="mt-4 rounded-2xl p-3" style={{ backgroundColor: "var(--color-paper)" }}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
              <TrustBadge level={doubt ? "doubtful" : trustLevel(trust.score)} />
              <span>
                {trust.confirmations > 0
                  ? `Confirmé actif par ${trust.confirmations} étudiant${trust.confirmations > 1 ? "s" : ""}`
                  : "Pas encore confirmé"}
              </span>
            </div>
            {trust.lastConfirmedAt !== null && (
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Dernière vérification : {ago(data.at - trust.lastConfirmedAt)} (
                {formatDate(new Date(trust.lastConfirmedAt).toISOString())})
              </p>
            )}
            {state.archived_at ? (
              <p className="mt-1 text-sm font-medium" style={{ color: "var(--color-aubergine)" }}>
                Offre retirée : signalée « Plus dispo » par des étudiants.
              </p>
            ) : doubt ? (
              <p className="mt-1 text-sm font-medium" style={{ color: "var(--color-aubergine)" }}>
                {reports} étudiants la disent « Plus dispo ». Sans {RESCUE_CONFIRMATIONS} « J&apos;en ai profité » d&apos;ici le{" "}
                {formatDate(new Date(doubt.deadline).toISOString())}, elle sera retirée ({Math.min(doubt.saved, RESCUE_CONFIRMATIONS)} sur{" "}
                {RESCUE_CONFIRMATIONS}).
              </p>
            ) : (
              reports > 0 && (
                <p className="mt-1 text-sm" style={{ color: "var(--color-aubergine)" }}>
                  Signalée « Plus dispo » par {reports} étudiant{reports > 1 ? "s" : ""} sur {DOUBT_REPORTS} avant de passer en
                  « Douteux ».
                </p>
              )
            )}
          </div>
        )}

        {/* « Y aller » seulement pour une offre placée sur la carte (la fiche n'existe que dans le navigateur). */}
        <div className={`mt-3 grid items-start gap-2 ${deal.lat !== null && deal.lng !== null ? "grid-cols-2" : "grid-cols-1"}`}>
          {deal.lat !== null && deal.lng !== null && (
            <a
              href={directionsUrl({ lat: deal.lat, lng: deal.lng }, navigator.userAgent)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => recordDirections(deal.id)}
              className="sw-btn-primary w-full"
            >
              <NavigationIcon className="h-4 w-4" /> Y aller
            </a>
          )}
          <ShareButton deal={deal} />
        </div>

        {data && (
          <div className="mt-3">
            <ReactionBar
              counts={recentCounts(data.votes, data.at)}
              reaction={reaction}
              busy={busy}
              own={own}
              onReact={react}
              placed={deal.lat !== null && deal.lng !== null}
            />
            <p className="mt-1.5 text-center text-xs text-[var(--color-muted)]">
              {own
                ? "C'est ton bon plan : tu suis ses réactions dans « Ciblés », onglet Activité."
                : reaction
                  ? "Touché par erreur ? Touche à nouveau pour décocher."
                  : "Réactions des 30 derniers jours."}
            </p>
            {!own && <DealLocationNote placed={deal.lat !== null && deal.lng !== null} />}
          </div>
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
