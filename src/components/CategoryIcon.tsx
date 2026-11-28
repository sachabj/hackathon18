import { CATEGORIES } from "@/lib/constants";
import type { DealCategory } from "@/lib/types";
import { tr } from "@/lib/i18n";

// Dessins de la bibliothèque Lucide (licence ISC), recopiés ici : le repère de la carte a besoin du SVG brut.
const PATHS: Record<DealCategory, string> = {
  // Lucide « shopping-cart »
  supermarket:
    '<path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18"/><path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25"/><circle cx="18" cy="20" r="2"/><circle cx="8" cy="20" r="2"/>',
  // Lucide « utensils »
  restaurant:
    '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  // Lucide « graduation-cap »
  scholarship:
    '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  // Lucide « bus »
  transport:
    '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
  // Lucide « ticket »
  activity:
    '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
  // Lucide « trophy »
  sport:
    '<path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2"/><path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2"/><path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3"/>',
};

const BG: Record<DealCategory, string> = {
  supermarket: "#1E3A2F",
  restaurant: "#CFE3CA",
  scholarship: "#E6DFF0",
  transport: "#1E3A2F",
  activity: "#4B2A63",
  sport: "#CFE3CA",
};

const STROKE: Record<DealCategory, string> = {
  supermarket: "#FAF9F5",
  restaurant: "#1E3A2F",
  scholarship: "#4B2A63",
  transport: "#FAF9F5",
  activity: "#FAF9F5",
  sport: "#1E3A2F",
};

/** Icône seule en SVG brut (pour un marqueur Leaflet `divIcon`, qui attend du HTML, pas du JSX). */
export function categoryIconSvg(category: DealCategory, size = 20) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${STROKE[category]}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[category]}</svg>`;
}

/** Rond coloré + icône au trait identifiant une catégorie de bon plan (voir DESIGN_SHAREWOOD.md). */
export default function CategoryIcon({
  category,
  label,
  size = 40,
  className = "",
}: {
  category: DealCategory;
  /** Nom affiché dans l'`aria-label` ; par défaut la catégorie brute. */
  label?: string;
  size?: number;
  className?: string;
}) {
  const iconSize = size * 0.58;
  return (
    <span
      role="img"
      aria-label={label ?? tr(CATEGORIES[category]?.label ?? category)}
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: BG[category] }}
    >
      <svg
        viewBox="0 0 24 24"
        width={iconSize}
        height={iconSize}
        fill="none"
        stroke={STROKE[category]}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: PATHS[category] }}
      />
    </span>
  );
}
