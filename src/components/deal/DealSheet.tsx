"use client";

// Fiche d'un bon plan : détail, fiabilité, votes et « J'en ai profité » (Justin).
import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { createPortal } from "react-dom";
import AuthorBadge from "@/components/AuthorBadge";
import CategoryIcon from "@/components/CategoryIcon";
import { LinkedText, OfferLink, RequirementBadges } from "@/components/deal/DealExtras";
import FavoriteButton from "@/components/deal/FavoriteButton";
import ReactionBar from "@/components/deal/ReactionBar";
import ReportDialog from "@/components/deal/ReportDialog";
import ShareButton from "@/components/deal/ShareButton";
import DealLocationNote from "@/components/location/DealLocationNote";
import { CalendarIcon, CameraIcon, CloseIcon, FlagIcon, NavigationIcon, PinIcon } from "@/components/icons";
import { recordDirections } from "@/lib/community";
import { CATEGORIES } from "@/lib/constants";
import { directionsUrl } from "@/lib/directions";
import { announceReactions, fetchEngagement, recordView, setReaction, type Engagement, type Reaction } from "@/lib/engagement";
import { isOwnPhotoUrl } from "@/lib/photos";
import { announceReported } from "@/lib/reports";
import {
  activeReports,
  dealEndReason,
  DOUBT_REPORTS,
  doubtStatus,
  recentCounts,
  reliability,
  RESCUE_CONFIRMATIONS,
  trustLevel,
  type EndReason,
} from "@/lib/rules";
import TrustBadge from "@/components/deal/TrustBadge";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Deal } from "@/lib/types";
import { useZones, zoneById } from "@/lib/zones";
import { dateLocale, tr, useT } from "@/lib/i18n";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(dateLocale(), { day: "numeric", month: "long" });

function ago(ms: number) {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return tr("il y a {n} min", { n: minutes });
  const hours = Math.round(minutes / 60);
  return hours < 24 ? tr("il y a {n} h", { n: hours }) : tr("il y a {n} j", { n: Math.round(hours / 24) });
}

/** Bandeau d'une offre terminée (lien partagé, favori, réaction qui la retire). */
function endMessage(reason: EndReason, expiresAt: string | null) {
  if (reason === "reports") return tr("Offre terminée : retirée après des signalements « Plus dispo ».");
  if (reason === "removed") return tr("Offre terminée : retirée par son auteur ou par un commerçant.");
  return tr("Offre terminée : elle était valable jusqu'au {date}.", { date: formatDate(expiresAt!) });
}

export default function DealSheet({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const [data, setData] = useState<(Engagement & { at: number }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(false);
  /** Tâche 71 : fenêtre de signalement ouverte, puis signalement envoyé. */
  const [reporting, setReporting] = useState(false);
  const reported = useRef(false);
  const t = useT();
  useZones(); // noms des villes chargées après coup
  // Instant fixé à l'ouverture (pas de Date.now() pendant le rendu).
  const [openedAt] = useState(Date.now);
  const photo = isOwnPhotoUrl(deal.photo_url) ? deal.photo_url : null;
  const category = CATEGORIES[deal.category];
  const where =
    deal.place_name ??
    (deal.scope === "national" ? t("Partout en France") : zoneById(deal.zone_id)?.name);

  // Seulement quand on change d'offre : la liste peut remplacer l'objet `deal` après une réaction.
  const { id: dealId, author_id: authorId } = deal;
  useEffect(() => {
    recordView({ id: dealId, author_id: authorId });
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchEngagement(dealId)
      .then((e) => !cancelled && setData({ ...e, at: Date.now() }))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [dealId, authorId]);

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
    // Échap ferme d'abord la fenêtre de signalement (elle a son propre écouteur), pas la fiche.
    if (reporting) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, reporting]);

  // Offre signalée : retirée des listes ouvertes une fois la fiche fermée (sinon la carte qui porte la fiche disparaîtrait avec elle).
  useEffect(
    () => () => {
      if (reported.current) announceReported(dealId);
    },
    [dealId],
  );

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      const fresh = await fetchEngagement(deal.id);
      setData({ ...fresh, at: Date.now() });
      announceReactions({ dealId: deal.id, votes: fresh.votes, trust: fresh.trust, state: fresh.state });
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  const own = data?.userId === deal.author_id;
  const trust = data ? reliability(data.votes, data.at, data.trust) : null;
  /** État relu après chaque réaction (douteuse, retirée). */
  const state = data?.state ?? deal;
  const current = { ...deal, ...data?.state };
  const endReason = dealEndReason(current, data?.votes ?? [], data?.at ?? openedAt);
  const placed = deal.lat !== null && deal.lng !== null;
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
            <CategoryIcon category={deal.category} size={22} /> {t(category.label)}
          </p>
          <div className="-mt-1 flex gap-2">
            <FavoriteButton dealId={deal.id} />
            <button
              type="button"
              onClick={close}
              aria-label={t("Fermer")}
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--color-paper)" }}
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <AuthorBadge deal={deal} className="mb-2" />
        <h2 className="text-xl leading-snug">{deal.title}</h2>
        {endReason && (
          <p
            role="status"
            className="mt-2 rounded-xl px-3 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--color-lilac)", color: "var(--color-aubergine)" }}
          >
            {endMessage(endReason, current.expires_at)}
          </p>
        )}
        {deal.description && (
          <p className="mt-2 text-sm text-[var(--color-ink)]">
            <LinkedText text={deal.description} />
          </p>
        )}
        {deal.link_url && (
          <p className="mt-1">
            <OfferLink href={deal.link_url} />
          </p>
        )}
        {/* Photo de preuve (Matteo) : miniature, en grand au toucher. */}
        {photo && (
          <button type="button" onClick={() => setZoom(true)} className="mt-2 flex items-center gap-2 text-left">
            {/* eslint-disable-next-line @next/next/no-img-element -- image du stockage Supabase */}
            <img src={photo} alt={t("Photo de l'offre")} loading="lazy" className="h-16 w-16 rounded-lg border object-cover" style={{ borderColor: "var(--color-border)" }} />
            <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
              <CameraIcon className="h-3.5 w-3.5" /> {t("Photo prise sur place")}
            </span>
          </button>
        )}
        {zoom && photo && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("Photo de l'offre")}
            onClick={() => setZoom(false)}
            className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/80 p-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- image du stockage Supabase */}
            <img src={photo} alt={t("Photo de l'offre")} className="max-h-full max-w-full rounded-xl" />
            <button type="button" className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm font-medium">
              <CloseIcon className="h-3.5 w-3.5" /> {t("Fermer")}
            </button>
          </div>
        )}
        {(deal.requirements?.length ?? 0) > 0 && (
          <div className="mt-2">
            <p className="sr-only">{t("Conditions :")}</p>
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
              <CalendarIcon className="h-3.5 w-3.5" /> {t("Date limite : {date}", { date: formatDate(deal.deadline_at) })}
            </span>
          )}
          {deal.expires_at && <span>{t("Jusqu'au {date}", { date: formatDate(deal.expires_at) })}</span>}
        </p>
        {deal.source_name && (
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {t("Source : {name}", { name: deal.source_name })}
            {deal.source_checked_at && t(", vérifiée le {date}", { date: formatDate(deal.source_checked_at) })}
            {t(". Conditions à confirmer sur la page de la source.")}
          </p>
        )}

        {trust && data && !endReason && (
          <div className="mt-4 rounded-2xl p-3" style={{ backgroundColor: "var(--color-paper)" }}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
              <TrustBadge level={doubt ? "doubtful" : trustLevel(trust.score)} />
              <span>
                {trust.confirmations > 0
                  ? t(trust.confirmations > 1 ? "Confirmé actif par {n} étudiants" : "Confirmé actif par {n} étudiant", { n: trust.confirmations })
                  : t("Pas encore confirmé")}
              </span>
            </div>
            {trust.lastConfirmedAt !== null && (
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t("Dernière vérification : {ago}", { ago: ago(data.at - trust.lastConfirmedAt) })} (
                {formatDate(new Date(trust.lastConfirmedAt).toISOString())})
              </p>
            )}
            {doubt ? (
              <p className="mt-1 text-sm font-medium" style={{ color: "var(--color-aubergine)" }}>
                {t("{n} étudiants la disent « Plus dispo ». Sans {k} « J'en ai profité » d'ici le {date}, elle sera retirée ({saved} sur {k}).", {
                  n: reports,
                  k: RESCUE_CONFIRMATIONS,
                  date: formatDate(new Date(doubt.deadline).toISOString()),
                  saved: Math.min(doubt.saved, RESCUE_CONFIRMATIONS),
                })}
              </p>
            ) : (
              reports > 0 && (
                <p className="mt-1 text-sm" style={{ color: "var(--color-aubergine)" }}>
                  {t(reports > 1 ? "Signalée « Plus dispo » par {n} étudiants sur {k} avant de passer en « Douteux »." : "Signalée « Plus dispo » par {n} étudiant sur {k} avant de passer en « Douteux ».", { n: reports, k: DOUBT_REPORTS })}
                </p>
              )
            )}
          </div>
        )}

        {/* « Y aller » seulement pour une offre placée sur la carte (la fiche n'existe que dans le navigateur). */}
        <div className={`mt-3 grid items-start gap-2 ${placed && !endReason ? "grid-cols-2" : "grid-cols-1"}`}>
          {deal.lat !== null && deal.lng !== null && !endReason && (
            <a
              href={directionsUrl({ lat: deal.lat, lng: deal.lng }, navigator.userAgent)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => recordDirections(deal.id)}
              className="sw-btn-primary w-full"
            >
              <NavigationIcon className="h-4 w-4" /> {t("Y aller")}
            </a>
          )}
          <ShareButton deal={deal} />
        </div>

        {data && !endReason && (
          <div className="mt-3">
            <ReactionBar
              counts={recentCounts(data.votes, data.at)}
              reaction={reaction}
              busy={busy}
              own={own}
              onReact={react}
              placed={placed}
            />
            <p className="mt-1.5 text-center text-xs text-[var(--color-muted)]">
              {own
                ? t("C'est ton bon plan : tu suis ses réactions dans « Ciblés », onglet Activité.")
                : reaction
                  ? t("Touché par erreur ? Touche à nouveau pour décocher.")
                  : t("Réactions des 30 derniers jours.")}
            </p>
            {!own && <DealLocationNote placed={placed} />}
          </div>
        )}
        {/* Tâche 71 : signaler (jamais sur son propre bon plan), discret sous les actions. */}
        {data && !own && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setReporting(true)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] underline-offset-2 hover:underline"
            >
              <FlagIcon className="h-3.5 w-3.5" /> {t("Signaler ce bon plan")}
            </button>
          </div>
        )}
        {reporting && (
          <ReportDialog
            dealId={deal.id}
            onCancel={() => setReporting(false)}
            onDone={() => {
              reported.current = true;
              setReporting(false);
              close();
            }}
          />
        )}
        {!data && !error && <p className="mt-4 text-sm text-[var(--color-muted)]">{t("Chargement…")}</p>}
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
