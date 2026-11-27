"use client";

import { useLayoutEffect, useState } from "react";
import AuthorBadge from "@/components/AuthorBadge";
import CategoryIcon from "@/components/CategoryIcon";
import { LinkedText, OfferLink, RequirementBadges } from "@/components/deal/DealExtras";
import DealSheet from "@/components/deal/DealSheet";
import { CalendarIcon, CameraIcon, CloseIcon, HeartIcon, StarIcon } from "@/components/icons";
import { CATEGORIES, ZONES } from "@/lib/constants";
import type { Match } from "@/lib/matching";
import { isBoosted } from "@/lib/merchant";
import { isOwnPhotoUrl } from "@/lib/photos";
import { trustLevelOf } from "@/lib/rules";
import TrustBadge from "@/components/deal/TrustBadge";
import type { DealWithVotes } from "@/lib/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

/** Carte d'un bon plan dans le fil. `match` absent tant que l'étudiant n'a pas rempli son profil. */
export default function DealCard({
  deal,
  match,
  favorite,
  onToggleFavorite,
}: {
  deal: DealWithVotes;
  match?: Match;
  /** Favori ou non ; le bouton cœur n'est affiché que si ce prop (et onToggleFavorite) est fourni. */
  favorite?: boolean;
  onToggleFavorite?: (dealId: string) => void;
}) {
  const category = CATEGORIES[deal.category];
  const where =
    deal.place_name ??
    (deal.scope === "national" ? "Partout en France" : ZONES.find((z) => z.id === deal.zone_id)?.name);

  const boosted = isBoosted(deal);
  const trust = deal.votes ? trustLevelOf(deal.votes) : undefined;
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const photo = isOwnPhotoUrl(deal.photo_url) ? deal.photo_url : null;
  // La fiche se referme quand la page est quittée (Next la conserve en mémoire).
  useLayoutEffect(
    () => () => {
      setOpen(false);
      setZoom(false);
    },
    [],
  );

  return (
    <article
      className="sw-card p-3"
      style={boosted ? { borderColor: "#d4a017", borderWidth: 2 } : undefined}
    >
      {boosted && (
        <p className="mb-1 flex items-center gap-1 text-xs font-medium" style={{ color: "#92700c" }}>
          <StarIcon className="h-3.5 w-3.5" filled /> Sponsorisé
        </p>
      )}
      <AuthorBadge deal={deal} className="mb-2" />
      <div className="flex items-start gap-3">
        <CategoryIcon category={deal.category} size={44} />
        <div className="min-w-0 flex-1">
          <h3 className="leading-snug font-medium">
            <button type="button" onClick={() => setOpen(true)} className="text-left">
              {deal.title}
            </button>
          </h3>
          <p className="text-sm text-[var(--color-muted)]">
            {deal.price_info && <span className="font-medium text-[var(--color-ink)]">{deal.price_info} · </span>}
            {where ?? category.label}
          </p>
        </div>
        {trust !== undefined && <TrustBadge level={trust} />}
        {onToggleFavorite && (
          <button
            type="button"
            aria-pressed={favorite}
            onClick={() => onToggleFavorite(deal.id)}
            className="shrink-0 transition active:scale-90"
            style={{ color: favorite ? "var(--color-aubergine)" : "var(--color-border)" }}
            title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <HeartIcon className="h-5 w-5" filled={favorite} />
            <span className="sr-only">{favorite ? "Retirer des favoris" : "Ajouter aux favoris"}</span>
          </button>
        )}
      </div>

      {deal.description && (
        <p className="mt-2 text-sm text-[var(--color-ink)]">
          <LinkedText text={deal.description} />
        </p>
      )}
      {(deal.requirements?.length ?? 0) > 0 && (
        <div className="mt-2">
          <RequirementBadges requirements={deal.requirements} />
        </div>
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
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- image du stockage Supabase */}
          <img src={photo} alt="Photo de l'offre" className="max-h-full max-w-full rounded-xl" />
          <button type="button" className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm font-medium">
            <CloseIcon className="h-3.5 w-3.5" /> Fermer
          </button>
        </div>
      )}

      {match && (match.reasons.length > 0 || match.warnings.length > 0) && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {match.reasons.slice(0, 3).map((r) => (
            <li
              key={r}
              className="sw-badge"
              style={{ backgroundColor: "var(--color-sage)", color: "var(--color-forest)" }}
            >
              {r}
            </li>
          ))}
          {match.warnings.map((w) => (
            <li
              key={w}
              className="sw-badge font-normal"
              style={{ backgroundColor: "var(--color-lilac)", color: "var(--color-aubergine)" }}
            >
              {w}
            </li>
          ))}
        </ul>
      )}

      {(deal.expires_at || deal.deadline_at) && (
        <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-[var(--color-muted)]">
          {deal.deadline_at && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5" /> Date limite : {formatDate(deal.deadline_at)}
            </span>
          )}
          {deal.expires_at && <span>Jusqu&apos;au {formatDate(deal.expires_at)}</span>}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium" style={{ color: "var(--color-forest)" }}>
          Voir et réagir ›
        </button>
        <OfferLink href={deal.link_url} />
      </div>
      {open && <DealSheet deal={deal} onClose={() => setOpen(false)} />}
    </article>
  );
}
