"use client";

import Link from "next/link";
import {
  ACTIVITIES,
  BUDGET_PROFILES,
  CATEGORIES,
  HOME_VISITS,
  SUBCATEGORIES,
  TRANSPORT_MODES,
} from "@/lib/constants";
import { isTraveler, type StudentProfile } from "@/lib/matching";
import { carteSortirArea, useZones, zoneById } from "@/lib/zones";
import { tr, useT } from "@/lib/i18n";

const yesNo = (value: boolean | null, label: string) =>
  value === null ? "" : tr(value ? "{label} : oui" : "{label} : non", { label: tr(label) });

/** Une ligne par étape du parcours (`step` = id de l'étape) : récapitulatif et profil. */
export function preferenceRows(me: StudentProfile) {
  return [
    {
      step: "zone",
      label: "Zones",
      value: [...me.zoneIds]
        .sort((a, b) => Number(b === me.homeZoneId) - Number(a === me.homeZoneId))
        .map((id) => zoneById(id)?.name ?? id)
        .map((name, i) => (i === 0 && me.homeZoneId ? tr("{name} (principale)", { name }) : name))
        .join(" · "),
    },
    {
      step: "transport",
      label: "Quotidien",
      value: me.transportModes.map((m) => TRANSPORT_MODES[m].label).join(" · "),
    },
    {
      step: "travel",
      label: "Voyages",
      value: [
        me.homeVisits && HOME_VISITS[me.homeVisits].label,
        isTraveler(me) && me.travelModes.map((m) => SUBCATEGORIES[m].label).join(", "),
      ]
        .filter(Boolean)
        .join(" · "),
    },
    {
      step: "budget",
      label: "Budget",
      value: me.budget ? BUDGET_PROFILES[me.budget].label : "",
    },
    {
      step: "aids",
      label: "Aides",
      value: [yesNo(me.isScholar, "Boursier"), carteSortirArea(me) && yesNo(me.hasCarteSortir, "Carte Sortir")].filter(Boolean).join(" · "),
    },
    {
      step: "categories",
      label: "Priorités",
      value: me.categories.map((c) => CATEGORIES[c].label).join(" · "),
    },
    {
      step: "activities",
      label: "Activités",
      value: me.activities.map((a) => ACTIVITIES[a].label).join(" · "),
    },
  ];
}

/** Résumé des préférences : chaque ligne ouvre directement son étape du parcours. */
export default function PreferencesSummary({ me }: { me: StudentProfile }) {
  const t = useT();
  useZones();
  return (
    <ul className="sw-card divide-y divide-[var(--color-border)]">
      {preferenceRows(me).map((row) => (
        <li key={row.step}>
          <Link href={`/onboarding?etape=${row.step}`} className="flex items-start gap-3 p-3 text-sm">
            <span className="w-20 shrink-0 text-[var(--color-muted)]">{t(row.label)}</span>
            {/* Valeurs faites de libellés : chacun est traduit. */}
            <span className="flex-1 font-medium">{row.value ? row.value.split(" · ").map((v) => t(v)).join(" · ") : t("Non renseigné")}</span>
            <span aria-hidden className="text-[var(--color-muted)]">›</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
