"use client";

// Choix de l'emplacement du commerce : toucher la carte ou utiliser sa position. Chargé via BusinessForm (ssr: false).
import L from "leaflet";
import { useLayoutEffect, useState } from "react";
import { MapContainer, Marker, useMapEvents } from "react-leaflet";
import LocationNotice from "@/components/location/LocationNotice";
import { ensureLocationConsent } from "@/lib/location";
import BaseMap from "@/components/map/BaseMap";
import { PinIcon } from "@/components/icons";
import { MAP_CENTER } from "@/lib/constants";
import type { Point } from "@/lib/geo";
import { useT } from "@/lib/i18n";

const STORE_SVG =
  '<svg viewBox="0 0 48 48" width="20" height="20" fill="none" stroke="#FAF9F5" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 9h5l4.5 20h21l4-14H12"/><circle cx="17" cy="36" r="2.5"/><circle cx="32" cy="36" r="2.5"/></svg>';

const PIN = L.divIcon({
  className: "wz-marker",
  html: `<div class="wz-pin" style="--pin:#1e3a2f">${STORE_SVG}</div>`,
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
  const t = useT();
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

  async function locate() {
    setError(null);
    if (!(await ensureLocationConsent(true))) {
      return setError(t("Position non partagée : touche la carte à l'emplacement du commerce."));
    }
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude };
        onChange(point);
        map?.setView([point.lat, point.lng], 18);
      },
      () => setError(t("Localisation impossible : touche la carte à l'emplacement du commerce.")),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative isolate h-64 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--color-border)" }}>
        {visible && (
          <MapContainer
            ref={setMap}
            center={value ? [value.lat, value.lng] : MAP_CENTER}
            zoom={value ? 17 : 14}
            className="h-full w-full"
          >
            <BaseMap />
            <ClickToPlace onChange={onChange} />
            {value && <Marker position={[value.lat, value.lng]} icon={PIN} title={t("Mon commerce")} />}
          </MapContainer>
        )}
      </div>
      <button type="button" onClick={locate} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--color-forest)" }}>
        <PinIcon className="h-4 w-4" />{" "}{t("Je suis dans mon commerce : utiliser ma position")}
      </button>
      <LocationNotice>{t("Envoyée chiffrée. Le point choisi devient l'emplacement public de ton commerce.")}</LocationNotice>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
