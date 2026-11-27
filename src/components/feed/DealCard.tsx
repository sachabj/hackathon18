"use client";

// Carte d'un bon plan, réduite à l'essentiel (tâches 35 et 37) : titre (qui dit l'avantage), lieu, fiabilité, conditions, échéance
// et réactions en un geste. Le reste (description, photo, lien, itinéraire) est dans la fiche (toucher la carte).
import { useLayoutEffect, useState } from "react";
import AuthorBadge from "@/components/AuthorBadge";
import CategoryIcon from "@/components/CategoryIcon";
import { RequirementBadges } from "@/components/deal/DealExtras";
import DealSheet from "@/components/deal/DealSheet";
import ReactionBar from "@/components/deal/ReactionBar";
import TrustBadge from "@/components/deal/TrustBadge";
import { CalendarIcon, HeartIcon, PinIcon, SparklesIcon } from "@/components/icons";
import { CATEGORIES, ZONES } from "@/lib/constants";
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
  onSelect,
  selected,
}: {
  deal: DealWithVotes;
  match?: Match;
  /** Favori ou non ; le bouton cœur n'est affiché que si ce prop (et onToggleFavorite) est fourni. */
  favorite?: boolean;
  onToggleFavorite?: (dealId: string) => void;
  /** Fourni (recherche, fil de Recherche) : toucher la carte sélectionne l'offre sur la carte au lieu d'ouvrir sa fiche. */
  onSelect?: (dealId: string) => void;
  /** Cette offre est celle choisie sur la carte (Recherche) : même contour aubergine que son repère. */
  selected?: boolean;
}) {
  const where =
    deal.place_name ??
    (deal.scope === "national" ? "Partout en France" : ZONES.find((z) => z.id === deal.zone_id)?.name) ??
    CATEGORIES[deal.category].label;
  const r = useDealReactions(deal);
  const [open, setOpen] = useState(false);
  // Rien à mettre en avant sur la carte pour une offre sans lieu (zone / nationale) : la fiche s'ouvre comme avant.
  const touch = () => (onSelect && deal.lat !== null && deal.lng !== null ? onSelect(deal.id) : setOpen(true));
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
      // Choisie sur la carte : contour aubergine (même couleur que son repère), prioritaire sur le cadre doré.
      style={
        selected
          ? { borderColor: "var(--color-aubergine)", borderWidth: 2 }
          : isBoosted(deal)
            ? { borderColor: "#d4a017", borderWidth: 2 }
            : undefined
      }
    >
      <div className="flex items-center gap-2">
        <button type="button" onClick={touch} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <CategoryIcon category={deal.category} size={40} />
          <span className="min-w-0 font-medium leading-snug">{deal.title}</span>
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

      {/* Lieu et distance sur toute la largeur, sous le titre et la fiabilité (tâche 38) ; pas de montant (tâche 37). */}
      <button
        type="button"
        onClick={touch}
        className="mt-1.5 flex w-full items-start gap-1 text-left text-sm text-[var(--color-muted)]"
      >
        <PinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0">{[where, match?.distance].filter(Boolean).join(" · ")}</span>
      </button>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {isBoosted(deal) && (
          // Explique le cadre doré (sinon sans texte, on ne sait pas que c'est une mise en avant payante).
          <span className="sw-badge" style={{ backgroundColor: "#d4a017", color: "#1A1A18" }}>
            <SparklesIcon className="h-3.5 w-3.5" /> Sponsorisé
          </span>
        )}
        <AuthorBadge deal={deal} />
        <RequirementBadges requirements={deal.requirements} />
        {deadline && (
          <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
            <CalendarIcon className="h-3.5 w-3.5" /> {deadline}
          </span>
        )}
      </div>

      <div className="mt-2.5">
        <ReactionBar size="sm" placed={deal.lat !== null && deal.lng !== null} counts={r.counts} reaction={r.reaction} busy={r.busy} own={r.own} onReact={r.react} />
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
