"use client";

// Page « Ciblés » : Flèches et grade, puis Favoris / Activité / Récompenses.
// L'adresse reste /favoris ; `?onglet=recompenses` ou `activite` ouvre directement un onglet.
import { useEffect, useState } from "react";
import ArrowBadge from "@/components/arrows/ArrowBadge";
import ArrowsCard from "@/components/arrows/ArrowsCard";
import SchoolRanking from "@/components/cibles/SchoolRanking";
import ActivityPanel from "@/components/cibles/ActivityPanel";
import FavoritesPanel from "@/components/cibles/FavoritesPanel";
import RewardsPanel from "@/components/rewards/RewardsPanel";
import Tabs from "@/components/Tabs";
import { APP_NAME } from "@/lib/constants";
import { useT } from "@/lib/i18n";

const TABS = [
  { id: "favoris", label: "Favoris" },
  { id: "activite", label: "Activité" },
  { id: "recompenses", label: "Récompenses" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Page() {
  const [tab, setTab] = useState<TabId>("favoris");
  const t = useT();

  // Relu à chaque arrivée sur la page ; sans paramètre, l'onglet précédent reste ouvert.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("onglet");
    const found = TABS.find((t) => t.id === wanted);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lu dans l'adresse après le montage (page statique)
    if (found) setTab(found.id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-6 md:max-w-3xl lg:max-w-6xl">
      <header
        className="sticky top-0 z-10 -mx-4 flex items-center gap-2 px-4 py-3 backdrop-blur lg:hidden"
        style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-surface) 95%, transparent)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- petit logo statique, SVG */}
        <img src="/logo.svg" alt="" width={28} height={28} className="shrink-0" aria-hidden />
        <p className="text-xl" style={{ color: "var(--color-ink)" }}>{APP_NAME}</p>
        <ArrowBadge className="ml-auto" />
      </header>

      <h1 className="sr-only">{t("Ciblés")}</h1>
      <div className="space-y-4 pt-4 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start lg:gap-6 lg:space-y-0 lg:pt-6">
        <div className="space-y-4">
          <ArrowsCard />
          <SchoolRanking />
        </div>
        <div>
          <Tabs label={t("Ciblés")} idPrefix="cibles" tabs={TABS.map((x) => ({ ...x, label: t(x.label) }))} selected={tab} onSelect={setTab} />
          <div id="cibles-panel" role="tabpanel" aria-labelledby={`cibles-${tab}`} className="pt-3">
            {tab === "favoris" && <FavoritesPanel />}
            {tab === "activite" && <ActivityPanel />}
            {tab === "recompenses" && <RewardsPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
