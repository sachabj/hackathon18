"use client";

// Fond de carte vectoriel OpenFreeMap (gratuit, sans clé), recoloré dans l'esprit d'Apple Plans.
import "@maplibre/maplibre-gl-leaflet";
import L from "leaflet";
import { setWorkerUrl, type StyleSpecification } from "maplibre-gl";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

// MapLibre 6 a besoin de l'adresse de son worker : Turbopack le publie comme fichier statique.
setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());

/** Couleurs par calque du style « liberty » (testées dans l'ordre, la première qui correspond gagne). */
const PALETTE: [RegExp, string][] = [
  [/^background$/, "#f5f2ea"],
  [/^water$/, "#9fd3f5"],
  [/^waterway/, "#9fd3f5"],
  [/^(park|landcover_(wood|grass)|landuse_(pitch|track|cemetery))$/, "#c9ebb5"],
  [/^landuse_residential$/, "#efece4"],
  [/^landuse_(school|hospital)$/, "#f3e9d8"],
  [/motorway.*casing|trunk_primary.*casing/, "#e9b949"],
  [/motorway(?!.*casing)|trunk_primary(?!.*casing)/, "#ffdc7a"],
  [/(secondary_tertiary|minor|service|link|street).*casing/, "#dcd7cc"],
  [/(road|bridge|tunnel)_(secondary_tertiary|minor|service_track|link|street)$/, "#ffffff"],
  [/^building$/, "#e6e1d6"],
];

function restyle(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    // Vue à plat : pas de bâtiments en 3D (Leaflet ne peut pas incliner la carte).
    layers: style.layers
      .filter((layer) => layer.type !== "fill-extrusion")
      .map((layer) => {
        const color = PALETTE.find(([pattern]) => pattern.test(layer.id))?.[1];
        const { type } = layer;
        if (!color || (type !== "background" && type !== "fill" && type !== "line")) return layer;
        return {
          ...layer,
          paint: { ...layer.paint, [`${type}-color`]: color },
        } as typeof layer;
      }),
  };
}

export default function BaseMap() {
  const map = useMap();

  useEffect(() => {
    let layer: L.Layer | undefined;
    let cancelled = false;

    // Secours si le style ou WebGL est indisponible : tuiles OpenStreetMap classiques.
    const fallback = () =>
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      });

    async function load() {
      try {
        const response = await fetch(STYLE_URL);
        if (!response.ok) throw new Error(`Style indisponible (${response.status})`);
        const style = restyle(await response.json());
        if (cancelled) return;
        layer = L.maplibreGL({ style });
        layer.addTo(map); // les crédits (OpenFreeMap, OpenStreetMap) viennent du style
      } catch (error) {
        console.warn("Fond de carte vectoriel indisponible", error);
        if (cancelled) return;
        layer?.remove();
        layer = fallback().addTo(map);
      }
    }

    load();
    return () => {
      cancelled = true;
      layer?.remove();
    };
  }, [map]);

  return null;
}
