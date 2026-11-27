"use client";

// Choix de l'emplacement du commerce : toucher la carte ou utiliser sa position. Chargé via BusinessForm (ssr: false).
import L from "leaflet";
import { useLayoutEffect, useState } from "react";
import { MapContainer, Marker, useMapEvents } from "react-leaflet";
import BaseMap from "@/components/map/BaseMap";
import { MAP_CENTER } from "@/lib/constants";
import type { Point } from "@/lib/geo";

const PIN = L.divIcon({
  className: "wz-marker",
  html: '<div class="wz-pin" style="--pin:#0a84ff"><span>🏪</span></div>',
  iconSize: [40, 48],
  iconAnchor: [20, 47],
});

function ClickToPlace({ onChange }: { onChange: (p: Point) => void }) {
  const map = useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.panTo(e.latlng);
    },
  });
  return null;
}

export default function LocationPicker({
  value,
  onChange,
}: {
  value: Point | null;
  onChange: (p: Point) => void;
}) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Next conserve les pages quittées (<Activity>) : la carte doit être recréée au retour.
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    return () => {
      setVisible(false);
      setMap(null);
    };
  }, []);

  function locate() {
    setError(null);
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude };
        onChange(point);
        map?.setView([point.lat, point.lng], 18);
      },
      () => setError("Localisation impossible : touche la carte à l'emplacement du commerce."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative isolate h-64 overflow-hidden rounded-2xl border border-zinc-200">
        {visible && (
          <MapContainer
            ref={setMap}
            center={value ? [value.lat, value.lng] : MAP_CENTER}
            zoom={value ? 17 : 14}
            className="h-full w-full"
          >
            <BaseMap />
            <ClickToPlace onChange={onChange} />
            {value && <Marker position={[value.lat, value.lng]} icon={PIN} title="Mon commerce" />}
          </MapContainer>
        )}
      </div>
      <button type="button" onClick={locate} className="text-sm font-semibold text-blue-600">
        📍 Je suis dans mon commerce : utiliser ma position
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
