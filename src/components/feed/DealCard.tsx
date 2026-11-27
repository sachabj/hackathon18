"use client";

import { useLayoutEffect, useState } from "react";
import DealSheet from "@/components/deal/DealSheet";
import { HeartIcon } from "@/components/icons";
import { CATEGORIES, ZONES } from "@/lib/constants";
import type { Match } from "@/lib/matching";
import { isBoosted } from "@/lib/merchant";
import { isOwnPhotoUrl } from "@/lib/photos";
import type { Deal } from "@/lib/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

/** Carte d'un bon plan dans le fil. `match` absent tant que l'étudiant n'a pas rempli son profil. */
export default function DealCard({
  deal,
  match,
  favorite,
  onToggleFavorite,
}: {
  deal: Deal;
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
    <article className={`rounded-2xl border bg-white p-3 shadow-sm ${boosted ? "border-amber-400" : "border-zinc-200"}`}>
      {boosted && <p className="mb-1 text-xs font-bold text-amber-700">⭐ Sponsorisé</p>}
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] text-xl"
          style={{ borderColor: category.color }}
          title={category.label}
        >
          {category.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug">
            <button type="button" onClick={() => setOpen(true)} className="text-left">
              {deal.title}
            </button>
          </h3>
          <p className="text-sm text-zinc-500">
            {deal.price_info && <span className="font-semibold text-zinc-800">{deal.price_info} · </span>}
            {where ?? category.label}
          </p>
        </div>
        {match?.forYou && (
          <span className="shrink-0 rounded-full bg-blue-600 px-2 py-1 text-xs font-bold text-white">
            {match.score} %<span className="sr-only"> compatible avec ton profil</span>
          </span>
        )}
        {onToggleFavorite && (
          <button
            type="button"
            aria-pressed={favorite}
            onClick={() => onToggleFavorite(deal.id)}
            className={`shrink-0 transition active:scale-90 ${favorite ? "text-rose-600" : "text-zinc-300 hover:text-zinc-400"}`}
            title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <HeartIcon className="h-5 w-5" filled={favorite} />
            <span className="sr-only">{favorite ? "Retirer des favoris" : "Ajouter aux favoris"}</span>
          </button>
        )}
      </div>

      {deal.description && <p className="mt-2 text-sm text-zinc-700">{deal.description}</p>}

      {/* Photo de preuve (Matteo) : miniature, en grand au toucher. */}
      {photo && (
        <button type="button" onClick={() => setZoom(true)} className="mt-2 flex items-center gap-2 text-left">
          {/* eslint-disable-next-line @next/next/no-img-element -- image du stockage Supabase */}
          <img src={photo} alt="Photo de l'offre" loading="lazy" className="h-16 w-16 rounded-lg border border-zinc-200 object-cover" />
          <span className="text-xs text-zinc-500">📷 Photo prise sur place</span>
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
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold">
            Fermer ✕
          </button>
        </div>
      )}

      {match && (match.reasons.length > 0 || match.warnings.length > 0) && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {match.reasons.slice(0, 3).map((r) => (
            <li key={r} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {r}
            </li>
          ))}
          {match.warnings.map((w) => (
            <li key={w} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-800">
              {w}
            </li>
          ))}
        </ul>
      )}

      {(deal.is_official || deal.expires_at || deal.deadline_at) && (
        <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-zinc-500">
          {deal.is_official && <span className="font-semibold text-blue-600">✔ Offre officielle</span>}
          {deal.deadline_at && <span>⏰ Date limite : {formatDate(deal.deadline_at)}</span>}
          {deal.expires_at && <span>Jusqu&apos;au {formatDate(deal.expires_at)}</span>}
        </p>
      )}
      <button type="button" onClick={() => setOpen(true)} className="mt-2 text-sm font-semibold text-blue-600">
        Voir et réagir ›
      </button>
      {open && <DealSheet deal={deal} onClose={() => setOpen(false)} />}
    </article>
  );
}
