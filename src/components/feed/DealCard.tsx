import { CATEGORIES, ZONES } from "@/lib/constants";
import type { Match } from "@/lib/matching";
import { isBoosted } from "@/lib/merchant";
import type { Deal } from "@/lib/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

/** Carte d'un bon plan dans le fil. `match` absent tant que l'étudiant n'a pas rempli son profil. */
export default function DealCard({ deal, match }: { deal: Deal; match?: Match }) {
  const category = CATEGORIES[deal.category];
  const where =
    deal.place_name ??
    (deal.scope === "national" ? "Partout en France" : ZONES.find((z) => z.id === deal.zone_id)?.name);

  const boosted = isBoosted(deal);

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
          <h3 className="font-semibold leading-snug">{deal.title}</h3>
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
      </div>

      {deal.description && <p className="mt-2 text-sm text-zinc-700">{deal.description}</p>}

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
    </article>
  );
}
