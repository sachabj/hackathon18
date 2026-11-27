"use client";

// Responsable : Justin (carte). Chargée uniquement côté client via DealsMapLoader.
import L from "leaflet";
import { useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { CATEGORIES, ZONES } from "@/lib/constants";
import type { Deal, DealCategory } from "@/lib/types";

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

export default function DealsMap({ deals }: { deals: Deal[] }) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [selected, setSelected] = useState("all");

  function focus(id: string) {
    setSelected(id);
    const zone = ZONES.find((z) => z.id === id);
    map?.flyToBounds(zone ? zoneBounds(zone) : ALL_BOUNDS, { duration: 0.8 });
  }

  return (
    // `isolate` garde les z-index de Leaflet sous la barre de navigation.
    <div className="relative isolate h-full w-full">
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
    </div>
  );
}
