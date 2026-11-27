"use client";

// Responsable : Justin (carte). Chargée uniquement côté client via DealsMapLoader.
import L from "leaflet";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { CATEGORIES, ZONES } from "@/lib/constants";
import type { Deal, DealCategory } from "@/lib/types";
import { useUserPosition } from "@/lib/useUserPosition";

/** Niveau de zoom « autour de moi » (quelques rues). */
const USER_ZOOM = 16;

const zoneBounds = (z: (typeof ZONES)[number]) => L.latLng(z.lat, z.lng).toBounds(z.radiusM * 2);

const ALL_BOUNDS = ZONES.reduce((b, z) => b.extend(zoneBounds(z)), L.latLngBounds([]));

// Marqueurs en HTML (emoji + couleur de la catégorie) : pas d'images Leaflet à charger.
const ICONS = Object.fromEntries(
  Object.entries(CATEGORIES).map(([key, { emoji, color }]) => [
    key,
    L.divIcon({
      className: "",
      html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#fff;border:3px solid ${color};box-shadow:0 2px 6px rgba(0,0,0,.35);font-size:18px">${emoji}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    }),
  ]),
) as Record<DealCategory, L.DivIcon>;

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
        <MapContainer ref={setMap} bounds={ALL_BOUNDS} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {ZONES.map((z) => (
            <Circle
              key={z.id}
              center={[z.lat, z.lng]}
              radius={z.radiusM}
              interactive={false}
              pathOptions={{ color: "#2563eb", weight: 1.5, fillOpacity: 0.05 }}
            />
          ))}
          {position && (
            <>
              <Circle
                center={[position.lat, position.lng]}
                radius={position.accuracy}
                interactive={false}
                pathOptions={{ stroke: false, color: "#2563eb", fillOpacity: 0.12 }}
              />
              <CircleMarker
                center={[position.lat, position.lng]}
                radius={8}
                pathOptions={{ color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}
              >
                <Popup>Tu es ici</Popup>
              </CircleMarker>
            </>
          )}
          {deals.map((d) =>
            d.lat === null || d.lng === null ? null : (
              <Marker key={d.id} position={[d.lat, d.lng]} icon={ICONS[d.category]} title={d.title}>
                <Popup>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-zinc-500">
                      {CATEGORIES[d.category].emoji} {CATEGORIES[d.category].label}
                    </span>
                    <strong className="text-sm">{d.title}</strong>
                    {d.is_official && (
                      <span className="text-xs font-semibold text-blue-600">✔ Offre officielle</span>
                    )}
                    {d.price_info && <span className="font-semibold">{d.price_info}</span>}
                    {d.description && <span>{d.description}</span>}
                    {d.place_name && <span>📍 {d.place_name}</span>}
                    {d.expires_at && (
                      <span className="text-xs text-zinc-500">Jusqu&apos;au {formatDate(d.expires_at)}</span>
                    )}
                  </div>
                </Popup>
              </Marker>
            ),
          )}
        </MapContainer>
      )}

      <div className="absolute right-2 top-2 z-[1000] flex gap-1">
        {[{ id: "all", name: "Tout" }, ...ZONES].map((z) => (
          <button
            key={z.id}
            type="button"
            onClick={() => focus(z.id)}
            aria-pressed={selected === z.id}
            className={`rounded-full px-3 py-1.5 text-sm font-medium shadow ${selected === z.id ? "bg-blue-600 text-white" : "bg-white text-zinc-700"}`}
          >
            {z.name}
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-6 left-2 right-2 z-[1000] flex flex-col items-start gap-1 *:pointer-events-auto">
        {error && (
          <p role="alert" className="rounded-lg bg-white px-3 py-1.5 text-sm text-red-600 shadow">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={locateMe}
          aria-pressed={selected === "me"}
          className={`rounded-full px-3 py-2 text-sm font-medium shadow ${selected === "me" ? "bg-blue-600 text-white" : "bg-white text-zinc-700"}`}
        >
          📍 {position || error ? "Autour de moi" : "Localisation…"}
        </button>
      </div>
    </div>
  );
}
