"use client";

// Cœur des favoris pour la fenêtre d'un repère et la fiche d'un bon plan (même état que les cartes du fil).
import { HeartIcon } from "@/components/icons";
import { useT } from "@/lib/i18n";
import { useChanges } from "@/lib/motion";
import { useFavorites } from "@/lib/useFavorites";

export default function FavoriteButton({ dealId, className = "" }: { dealId: string; className?: string }) {
  const t = useT();
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  const favorite = isFavorite(dealId);
  const liked = useChanges(favorite);
  const label = favorite ? t("Retirer des favoris") : t("Ajouter aux favoris");
  return (
    <button
      type="button"
      aria-pressed={favorite}
      disabled={loading}
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(dealId);
      }}
      title={label}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-90 disabled:opacity-50 ${className}`}
      style={{ backgroundColor: "var(--color-paper)", color: favorite ? "var(--color-aubergine)" : "var(--color-muted)" }}
    >
      {/* Même animation que le cœur des cartes (tâche 75). */}
      <span key={liked.count} className={`block ${liked.count > 0 && favorite ? "sw-heart-pop rounded-full" : ""}`}>
        <HeartIcon className="h-5 w-5" filled={favorite} />
      </span>
      <span className="sr-only">{label}</span>
    </button>
  );
}
