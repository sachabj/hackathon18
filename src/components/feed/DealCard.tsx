"use client";

// Carte d'un bon plan, réduite à l'essentiel (tâche 35) : titre, prix, lieu, fiabilité, conditions, échéance
// et réactions en un geste. Le reste (description, photo, lien, itinéraire) est dans la fiche (toucher la carte).
import { useLayoutEffect, useState } from "react";
import AuthorBadge from "@/components/AuthorBadge";
import CategoryIcon from "@/components/CategoryIcon";
import { RequirementBadges } from "@/components/deal/DealExtras";
import DealSheet from "@/components/deal/DealSheet";
import ReactionBar from "@/components/deal/ReactionBar";
import TrustBadge from "@/components/deal/TrustBadge";
import { CalendarIcon, FlameIcon, HeartIcon } from "@/components/icons";
import { CATEGORIES, ZONES } from "@/lib/constants";
import { isTrending } from "@/lib/hot";
import type { Match } from "@/lib/matching";
import { isBoosted } from "@/lib/merchant";
import type { DealWithVotes } from "@/lib/types";
import { useDealReactions } from "@/lib/useDealReactions";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

/** `match` absent tant que l'étudiant n'a pas rempli son profil : seule la distance en est affichée. */
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
  const where =
    deal.place_name ??
    (deal.scope === "national" ? "Partout en France" : ZONES.find((z) => z.id === deal.zone_id)?.name) ??
    CATEGORIES[deal.category].label;
  const r = useDealReactions(deal);
  const [open, setOpen] = useState(false);
  // La fiche se referme quand la page est quittée (Next la conserve en mémoire).
  useLayoutEffect(() => () => setOpen(false), []);
  const deadline = deal.deadline_at
    ? `Avant le ${formatDate(deal.deadline_at)}`
    : deal.expires_at
      ? `Jusqu'au ${formatDate(deal.expires_at)}`
      : null;

  return (
    <article
      className="sw-card p-3"
      // Offre mise en avant : le cadre doré suffit (plus d'étiquette « Sponsorisé »).
      style={isBoosted(deal) ? { borderColor: "#d4a017", borderWidth: 2 } : undefined}
    >
      <div className="flex items-start gap-2">
        <button type="button" onClick={() => setOpen(true)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <CategoryIcon category={deal.category} size={40} />
          <span className="min-w-0">
            <span className="flex items-center gap-1 font-medium leading-snug">
              {deal.title}
              {isTrending(r.votes, r.now) && (
                <span role="img" aria-label="Tendance" title="Tendance : beaucoup d'étudiants y sont allés aujourd'hui" className="shrink-0 text-[var(--color-aubergine)]">
                  <FlameIcon className="h-4 w-4" />
                </span>
              )}
            </span>
            <span className="block text-sm text-[var(--color-muted)]">
              {[deal.price_info, where, match?.distance].filter(Boolean).map((part, i) => (
                <span key={i} className={i === 0 && deal.price_info ? "font-medium text-[var(--color-ink)]" : undefined}>
                  {i > 0 && " · "}
                  {part}
                </span>
              ))}
            </span>
          </span>
        </button>
        {r.trust !== undefined && <TrustBadge level={r.trust} />}
        {onToggleFavorite && (
          <button
            type="button"
            aria-pressed={favorite}
            onClick={() => onToggleFavorite(deal.id)}
            className="shrink-0 pt-0.5 transition active:scale-90"
            style={{ color: favorite ? "var(--color-aubergine)" : "var(--color-border)" }}
            title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <HeartIcon className="h-5 w-5" filled={favorite} />
            <span className="sr-only">{favorite ? "Retirer des favoris" : "Ajouter aux favoris"}</span>
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <AuthorBadge deal={deal} />
        <RequirementBadges requirements={deal.requirements} />
        {deadline && (
          <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
            <CalendarIcon className="h-3.5 w-3.5" /> {deadline}
          </span>
        )}
      </div>

      <div className="mt-2.5">
        <ReactionBar size="sm" counts={r.counts} reaction={r.reaction} busy={r.busy} own={r.own} onReact={r.react} />
        {r.error && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {r.error}
          </p>
        )}
      </div>
      {open && <DealSheet deal={deal} onClose={() => setOpen(false)} onReactionsChange={r.remember} />}
    </article>
  );
}
