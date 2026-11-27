"use client";

import dynamic from "next/dynamic";

// Leaflet a besoin de `window` : pas de rendu côté serveur.
const DealsMap = dynamic(() => import("./DealsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500">
      Chargement de la carte…
    </div>
  ),
});

export default DealsMap;
