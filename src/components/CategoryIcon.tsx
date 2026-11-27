import { CATEGORIES } from "@/lib/constants";
import type { DealCategory } from "@/lib/types";

const PATHS: Record<DealCategory, string> = {
  supermarket:
    '<path d="M5 9h5l4.5 20h21l4-14H12"/><circle cx="17" cy="36" r="2.5"/><circle cx="32" cy="36" r="2.5"/>',
  restaurant: '<path d="M17 8v32"/><path d="M12 8v9a5 5 0 0 0 10 0V8"/><path d="M34 40V8c-4.5 3-7 9-7 16h7"/>',
  scholarship:
    '<circle cx="24" cy="24" r="16"/><path d="M30 17.5a8.5 8.5 0 1 0 0 13"/><path d="M15 22h11"/><path d="M15 26.5h11"/>',
  transport:
    '<rect x="10" y="7" width="28" height="28" rx="5"/><path d="M10 21h28"/><path d="M15 35v5"/><path d="M33 35v5"/><path d="M17 28h.01"/><path d="M31 28h.01"/>',
  activity:
    '<path d="M21 7l3.2 9.3 9.3 3.2-9.3 3.2L21 32l-3.2-9.3-9.3-3.2 9.3-3.2z"/><path d="M35 28l1.7 4.3 4.3 1.7-4.3 1.7L35 40l-1.7-4.3-4.3-1.7 4.3-1.7z"/>',
  sport:
    '<circle cx="24" cy="24" r="16"/><path d="M24 8v32"/><path d="M8 24h32"/><path d="M13 12.5c5.5 6.5 5.5 16.5 0 23"/><path d="M35 12.5c-5.5 6.5-5.5 16.5 0 23"/>',
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

export const CATEGORY_ICON_BG = BG;

/** Icône seule en SVG brut (pour un marqueur Leaflet `divIcon`, qui attend du HTML, pas du JSX). */
export function categoryIconSvg(category: DealCategory, size = 20) {
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke="${STROKE[category]}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[category]}</svg>`;
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
  const iconSize = size * 0.52;
  return (
    <span
      role="img"
      aria-label={label ?? CATEGORIES[category]?.label ?? category}
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: BG[category] }}
    >
      <svg
        viewBox="0 0 48 48"
        width={iconSize}
        height={iconSize}
        fill="none"
        stroke={STROKE[category]}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: PATHS[category] }}
      />
    </span>
  );
}
