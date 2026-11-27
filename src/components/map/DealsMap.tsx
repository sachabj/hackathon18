"use client";

// Responsable : Justin (carte). Chargée uniquement côté client via DealsMapLoader.
import L from "leaflet";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Circle, MapContainer, Marker, Popup } from "react-leaflet";
import DealSheet from "@/components/deal/DealSheet";
import { CATEGORIES, ZONES } from "@/lib/constants";
import { recordView } from "@/lib/engagement";
import { isBoosted } from "@/lib/merchant";
import type { Deal, DealCategory } from "@/lib/types";
import { useUserPosition } from "@/lib/useUserPosition";
import BaseMap from "./BaseMap";

/** Niveau de zoom « autour de moi » (quelques rues). */
const USER_ZOOM = 16;

const zoneBounds = (z: (typeof ZONES)[number]) => L.latLng(z.lat, z.lng).toBounds(z.radiusM * 2);

const ALL_BOUNDS = ZONES.reduce((b, z) => b.extend(zoneBounds(z)), L.latLngBounds([]));

// Repères façon Waze (goutte colorée + emoji), en HTML : styles dans globals.css (.wz-pin).
function pins(boosted: boolean) {
  return Object.fromEntries(
    Object.entries(CATEGORIES).map(([key, { emoji, color }]) => [
      key,
      L.divIcon({
        className: "wz-marker",
        html: `<div class="wz-pin${boosted ? " wz-pin-boosted" : ""}" style="--pin:${color}"><span>${emoji}</span></div>`,
        iconSize: [40, 48],
        iconAnchor: [20, 47],
        popupAnchor: [0, -44],
      }),
    ]),
  ) as Record<DealCategory, L.DivIcon>;
}
const ICONS = pins(false);
/** Offres mises en avant par un commerçant : contour doré, au-dessus des autres. */
const BOOSTED_ICONS = pins(true);

const USER_ICON = L.divIcon({
  className: "wz-marker",
  html: '<div class="wz-me"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

export default function DealsMap({
  deals,
  homeZoneId,
}: {
  deals: Deal[];
  /** Zone principale de l'étudiant : vue par défaut tant que le GPS n'a pas répondu (ou s'il est refusé). */
  homeZoneId?: string | null;
}) {
  const [map, setMap] = useState<L.Map | null>(null);
  /** Vue choisie par l'utilisateur ; null tant qu'il n'a rien choisi. */
  const [choice, setChoice] = useState<string | null>(null);
  const { position, error, retry } = useUserPosition();
  const home = ZONES.find((z) => z.id === homeZoneId);
  const selected = choice ?? (position ? "me" : (home?.id ?? "all"));
  const [visible, setVisible] = useState(false);
  /** Bon plan dont la fiche est ouverte */
  const [detail, setDetail] = useState<Deal | null>(null);
  /** Vrai dès que la vue ne doit plus être recentrée automatiquement. */
  const viewTaken = useRef(false);

  // Next conserve les pages quittées (React <Activity>), mais Leaflet ne sait pas se réattacher :
  // on démonte la carte quand la page est cachée et on la recrée au retour.
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    return () => {
      setVisible(false);
      setMap(null);
      setChoice(null);
      setDetail(null);
      viewTaken.current = false;
    };
  }, []);

  useEffect(() => {
    if (!map || !home || position || viewTaken.current) return;
    map.fitBounds(L.latLng(home.lat, home.lng).toBounds(Math.max(home.radiusM, 3000) * 2));
  }, [map, home, position]);

  // L'utilisateur a déplacé la carte avant que le GPS réponde : on ne la lui reprend pas.
  useEffect(() => {
    const take = () => {
      viewTaken.current = true;
    };
    map?.on("dragstart", take);
    return () => {
      map?.off("dragstart", take);
    };
  }, [map]);

  // Première position reçue : on arrive directement autour de l'utilisateur.
  useEffect(() => {
    if (!map || !position || viewTaken.current) return;
    viewTaken.current = true;
    map.setView([position.lat, position.lng], USER_ZOOM);
  }, [map, position]);

  function focus(id: string) {
    viewTaken.current = true;
    setChoice(id);
    const zone = ZONES.find((z) => z.id === id);
    map?.flyToBounds(zone ? zoneBounds(zone) : ALL_BOUNDS, { duration: 0.8 });
  }

  function locateMe() {
    setChoice("me");
    if (position) map?.flyTo([position.lat, position.lng], USER_ZOOM, { duration: 0.8 });
    else {
      viewTaken.current = false;
      retry();
    }
  }

  return (
    // `isolate` garde les z-index de Leaflet sous la barre de navigation.
    <div className="relative isolate h-full w-full">
      {visible && (
        <MapContainer ref={setMap} bounds={ALL_BOUNDS} zoomControl={false} className="h-full w-full">
          <BaseMap />
          {ZONES.map((z) => (
            <Circle
              key={z.id}
              center={[z.lat, z.lng]}
              radius={z.radiusM}
              interactive={false}
              pathOptions={{ color: "#0a84ff", weight: 1.5, opacity: 0.45, dashArray: "4 8", fillOpacity: 0.025 }}
            />
          ))}
          {position && (
            <>
              <Circle
                center={[position.lat, position.lng]}
                radius={position.accuracy}
                interactive={false}
                pathOptions={{ stroke: false, color: "#0a84ff", fillOpacity: 0.12 }}
              />
              <Marker position={[position.lat, position.lng]} icon={USER_ICON} title="Tu es ici" zIndexOffset={1000}>
                <Popup>Tu es ici</Popup>
              </Marker>
            </>
          )}
          {deals.map((d) =>
            d.lat === null || d.lng === null ? null : (
              <Marker
                key={d.id}
                position={[d.lat, d.lng]}
                icon={(isBoosted(d) ? BOOSTED_ICONS : ICONS)[d.category]}
                zIndexOffset={isBoosted(d) ? 500 : 0}
                title={d.title}
                eventHandlers={{ popupopen: () => recordView(d) }}
              >
                {/* Marges : la fiche ne doit pas passer sous les boutons de zone. */}
                <Popup autoPanPaddingTopLeft={[16, 60]} autoPanPaddingBottomRight={[16, 24]} maxHeight={180}>
                  <div className="flex min-w-48 flex-col gap-1">
                    <span
                      className="self-start rounded-full px-2 py-0.5 text-xs font-semibold text-zinc-900"
                      style={{ backgroundColor: `${CATEGORIES[d.category].color}33` }}
                    >
                      {CATEGORIES[d.category].emoji} {CATEGORIES[d.category].label}
                    </span>
                    <strong className="text-base leading-tight">{d.title}</strong>
                    {isBoosted(d) && <span className="text-xs font-semibold text-amber-700">⭐ Sponsorisé</span>}
                    {d.is_official && (
                      <span className="text-xs font-semibold text-blue-600">✔ Offre officielle</span>
                    )}
                    {d.price_info && <span className="text-sm font-bold text-green-700">{d.price_info}</span>}
                    {d.description && <span>{d.description}</span>}
                    {d.place_name && <span className="text-zinc-500">📍 {d.place_name}</span>}
                    {d.expires_at && (
                      <span className="text-xs text-zinc-500">Jusqu&apos;au {formatDate(d.expires_at)}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setDetail(d)}
                      className="mt-1 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      Voir et réagir
                    </button>
                  </div>
                </Popup>
              </Marker>
            ),
          )}
        </MapContainer>
      )}

      {detail && <DealSheet deal={detail} onClose={() => setDetail(null)} />}

      {/* Choix de la zone, flottant au-dessus de la carte. */}
      <div className="pointer-events-none absolute inset-x-1 top-1 z-[1000] flex justify-center">
        <div className="pointer-events-auto flex max-w-full gap-2 overflow-x-auto p-2 [scrollbar-width:none]">
          {[{ id: "all", name: "Tout" }, ...ZONES].map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => focus(z.id)}
              aria-pressed={selected === z.id}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-95 ${selected === z.id ? "bg-[#0a84ff] text-white shadow-lg" : "wz-glass text-zinc-700"}`}
            >
              {z.name}
            </button>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-3 right-3 z-[1000] flex flex-col items-end gap-2 *:pointer-events-auto">
        {error && (
          <p role="alert" className="wz-glass self-stretch rounded-2xl px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={locateMe}
          aria-label="Autour de moi"
          title="Autour de moi"
          aria-pressed={selected === "me"}
          className={`wz-glass flex h-13 w-13 items-center justify-center rounded-full text-[#0a84ff] transition active:scale-95 ${!position && !error ? "animate-pulse" : ""}`}
        >
          {/* Flèche de localisation : pleine quand la carte est centrée sur soi. */}
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
            <path
              d="M21 3 3 10.5l7.8 2.7L13.5 21 21 3Z"
              fill={selected === "me" && position ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
