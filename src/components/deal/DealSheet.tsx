"use client";

// Fiche d'un bon plan : détail, fiabilité, votes et « J'y suis allé » (Justin).
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AuthorBadge from "@/components/AuthorBadge";
import CategoryIcon from "@/components/CategoryIcon";
import { LinkedText, OfferLink, RequirementBadges } from "@/components/deal/DealExtras";
import ReactionBar from "@/components/deal/ReactionBar";
import { CalendarIcon, CameraIcon, CloseIcon, NavigationIcon, PinIcon } from "@/components/icons";
import { CATEGORIES, ZONES } from "@/lib/constants";
import { directionsUrl } from "@/lib/directions";
import { fetchEngagement, recordView, setReaction, type Engagement, type Reaction, type Reactions } from "@/lib/engagement";
import { isOwnPhotoUrl } from "@/lib/photos";
import { ARCHIVE_REPORTS, recentCounts, reliability, trustLevel } from "@/lib/rules";
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
      const fresh = await fetchEngagement(deal.id);
      setData({ ...fresh, at: Date.now() });
      onReactionsChange?.({ votes: fresh.votes, trust: fresh.trust });
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
        placed: deal.lat !== null && deal.lng !== null,
      }),
    );
  }
  // Dans <body> : la fiche doit passer au-dessus de la carte, de l'en-tête et de la barre du bas.
  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 lg:items-center lg:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={deal.title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-4 pb-6 lg:rounded-3xl lg:max-w-lg"
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

        {trust && data && (
          <div className="mt-4 rounded-2xl p-3" style={{ backgroundColor: "var(--color-paper)" }}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
              <TrustBadge level={trustLevel(trust.score)} />
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
            {trust.reports >= ARCHIVE_REPORTS ? (
              <p className="mt-1 text-sm font-medium" style={{ color: "var(--color-aubergine)" }}>
                Offre archivée : signalée expirée par {trust.reports} étudiants.
              </p>
            ) : (
              trust.reports > 0 && (
                <p className="mt-1 text-sm" style={{ color: "var(--color-aubergine)" }}>
                  Signalée expirée par {trust.reports} étudiant{trust.reports > 1 ? "s" : ""} sur {ARCHIVE_REPORTS} avant
                  archivage.
                </p>
              )
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

        {data && (
          <div className="mt-3">
            <ReactionBar counts={recentCounts(data.votes, data.at)} reaction={reaction} busy={busy} own={own} onReact={react} />
            <p className="mt-1.5 text-center text-xs text-[var(--color-muted)]">
              {own
                ? "C'est ton bon plan : tu suis ses réactions dans « Ciblés », onglet Activité."
                : reaction
                  ? "Touché par erreur ? Touche à nouveau pour décocher."
                  : "Réactions des 30 derniers jours."}
            </p>
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
