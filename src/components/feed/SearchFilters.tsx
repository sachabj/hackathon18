// Filtres affichés au-dessus des résultats de la page /recherche.
import Link from "next/link";
import { REQUIREMENTS, TRANSPORT_MODES } from "@/lib/constants";
import { DURATIONS, FILTER_MODES, PRICE_FILTERS, SORTS, type SearchFilters as Filters } from "@/lib/searchFilters";

/** Liste déroulante native (pratique au doigt) ; mise en évidence quand elle filtre quelque chose. */
function Select<V extends string>({
  label,
  value,
  options,
  active,
  disabled,
  onChange,
}: {
  label: string;
  value: V;
  options: { value: V; label: string; disabled?: boolean }[];
  active: boolean;
  disabled?: boolean;
  onChange: (value: V) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as V)}
      className="w-full min-w-0 rounded-md border px-2 py-2 text-sm font-medium disabled:opacity-50"
      style={
        active
          ? { borderColor: "var(--color-forest)", backgroundColor: "var(--color-sage)", color: "var(--color-forest)" }
          : { borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-ink)" }
      }
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function SearchFilters({
  filters,
  hasOrigin,
  originLabel,
  profileHref,
  onChange,
  onReset,
}: {
  filters: Filters;
  /** Position ou zone connue : sans elle, ni temps de trajet ni tri par distance. */
  hasOrigin: boolean;
  originLabel: string;
  profileHref: string;
  onChange: (patch: Partial<Filters>) => void;
  /** Absent : aucun filtre actif. */
  onReset?: () => void;
}) {
  const travelActive = hasOrigin && filters.maxMinutes !== null;
  const usesDistance = travelActive || (hasOrigin && filters.sort === "distance");
  return (
    <div role="group" aria-label="Filtres de recherche" className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Select
          label="Prix"
          value={filters.price}
          active={filters.price !== "any"}
          options={Object.entries(PRICE_FILTERS).map(([value, f]) => ({ value: value as Filters["price"], label: f.label }))}
          onChange={(price) => onChange({ price })}
        />
        <Select
          label="Tri"
          value={!hasOrigin && filters.sort === "distance" ? "relevance" : filters.sort}
          active={filters.sort !== "relevance" && (hasOrigin || filters.sort !== "distance")}
          options={Object.entries(SORTS).map(([value, label]) => ({
            value: value as Filters["sort"],
            label,
            disabled: value === "distance" && !hasOrigin,
          }))}
          onChange={(sort) => onChange({ sort })}
        />
        <Select
          label="Temps de trajet"
          value={String(hasOrigin ? (filters.maxMinutes ?? "any") : "any")}
          active={travelActive}
          disabled={!hasOrigin}
          options={[
            { value: "any", label: "Trajet : tous" },
            ...DURATIONS.map((d) => ({ value: String(d), label: `${d} min maximum` })),
          ]}
          onChange={(v) => onChange({ maxMinutes: DURATIONS.find((d) => String(d) === v) ?? null })}
        />
        <Select
          label="Moyen de transport"
          value={filters.mode}
          active={travelActive}
          disabled={!hasOrigin}
          // « À pied », « À vélo », « En bus »… : compréhensible même sans durée choisie.
          options={FILTER_MODES.map((m) => {
            const { by } = TRANSPORT_MODES[m];
            return { value: m, label: by.charAt(0).toUpperCase() + by.slice(1) };
          })}
          onChange={(mode) => onChange({ mode })}
        />
        <div className="col-span-2">
          <Select
            label="Conditions"
            value={filters.requirement}
            active={filters.requirement !== "any"}
            options={[
              { value: "any", label: "Conditions : toutes" },
              { value: "none", label: "Sans condition" },
              ...Object.entries(REQUIREMENTS).map(([value, r]) => ({ value: value as Filters["requirement"], label: r.label })),
            ]}
            onChange={(requirement) => onChange({ requirement })}
          />
        </div>
      </div>

      {!hasOrigin && (
        <p className="text-xs text-[var(--color-muted)]">
          <Link href={profileHref} className="font-medium underline" style={{ color: "var(--color-forest)" }}>
            Indique ta zone
          </Link>{" "}
          pour filtrer par temps de trajet ou trier par distance.
        </p>
      )}
      {usesDistance && (
        <p className="text-xs text-[var(--color-muted)]">
          Trajets estimés depuis {originLabel}, à vol d&apos;oiseau.
          {travelActive && " Les offres sans lieu précis sont masquées."}
        </p>
      )}
      {onReset && (
        <button type="button" onClick={onReset} className="text-sm font-medium underline" style={{ color: "var(--color-forest)" }}>
          Retirer les filtres
        </button>
      )}
    </div>
  );
}
