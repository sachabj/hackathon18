import Link from "next/link";
import {
  ACTIVITIES,
  BUDGET_PROFILES,
  CATEGORIES,
  HOME_VISITS,
  SUBCATEGORIES,
  TRANSPORT_MODES,
  ZONES,
} from "@/lib/constants";
import { isTraveler, type StudentProfile } from "@/lib/matching";

/** Résumé des préférences : chaque ligne ouvre directement son étape du parcours. */
export default function PreferencesSummary({ me }: { me: StudentProfile }) {
  const rows = [
    {
      step: "zone",
      label: "Zones",
      value: ZONES.filter((z) => me.zoneIds.includes(z.id))
        .map((z) => (z.id === me.homeZoneId ? `🏠 ${z.name}` : z.name))
        .join(" · "),
    },
    {
      step: "transport",
      label: "Quotidien",
      value: me.transportModes.map((m) => `${TRANSPORT_MODES[m].emoji} ${TRANSPORT_MODES[m].label}`).join(" · "),
    },
    {
      step: "travel",
      label: "Voyages",
      value: [
        me.homeVisits && `Chez les parents : ${HOME_VISITS[me.homeVisits].label.toLowerCase()}`,
        me.wantsTravel !== null && (me.wantsTravel ? "🌍 Envie de voyager" : "Pas de voyage prévu"),
        isTraveler(me) && me.travelModes.map((m) => `${SUBCATEGORIES[m].emoji} ${SUBCATEGORIES[m].label}`).join(", "),
      ]
        .filter(Boolean)
        .join(" · "),
    },
    {
      step: "budget",
      label: "Budget",
      value: me.budget ? `${BUDGET_PROFILES[me.budget].emoji} ${BUDGET_PROFILES[me.budget].label}` : "",
    },
    {
      step: "categories",
      label: "Priorités",
      value: me.categories.map((c) => `${CATEGORIES[c].emoji} ${CATEGORIES[c].label}`).join(" · "),
    },
    {
      step: "activities",
      label: "Activités",
      value: me.activities.map((a) => `${ACTIVITIES[a].emoji} ${ACTIVITIES[a].label}`).join(" · "),
    },
  ];

  return (
    <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
      {rows.map((row) => (
        <li key={row.step}>
          <Link href={`/onboarding?etape=${row.step}`} className="flex items-start gap-3 p-3 text-sm">
            <span className="w-20 shrink-0 text-zinc-500">{row.label}</span>
            <span className="flex-1 font-medium">{row.value || "Non renseigné"}</span>
            <span aria-hidden className="text-zinc-400">›</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
