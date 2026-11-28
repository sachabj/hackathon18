"use client";

import dynamic from "next/dynamic";
import { useT } from "@/lib/i18n";

// Leaflet a besoin de `window` : pas de rendu côté serveur.
const DealsMap = dynamic(() => import("./DealsMap"), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapLoading() {
  const t = useT();
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--color-paper)] text-sm text-[var(--color-muted)]">
      {t("Chargement de la carte…")}
    </div>
  );
}

export default DealsMap;
