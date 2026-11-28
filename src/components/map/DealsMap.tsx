"use client";

// Responsable : Justin (carte). Chargée uniquement côté client via DealsMapLoader.
import L from "leaflet";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Circle, MapContainer, Marker, Popup } from "react-leaflet";
import AuthorBadge from "@/components/AuthorBadge";
import CategoryIcon, { categoryIconSvg } from "@/components/CategoryIcon";
import { PinIcon, SparklesIcon } from "@/components/icons";
import QuickReactions from "@/components/deal/QuickReactions";
import { CATEGORIES, ZONES } from "@/lib/constants";
import { recordView } from "@/lib/engagement";
import { isBoosted } from "@/lib/merchant";
import type { Deal, DealCategory, DealWithVotes } from "@/lib/types";
import { useUserPosition } from "@/lib/useUserPosition";
import DealSheet from "@/components/deal/DealSheet";
import BaseMap from "./BaseMap";

/** Niveau de zoom « autour de moi » (quelques rues). */
const USER_ZOOM = 16;

const zoneBounds = (z: (typeof ZONES)[number]) => L.latLng(z.lat, z.lng).toBounds(z.radiusM * 2);

const ALL_BOUNDS = ZONES.reduce((b, z) => b.extend(zoneBounds(z)), L.latLngBounds([]));

// Repères façon Waze (goutte colorée + icône au trait), en HTML : styles dans globals.css (.wz-pin).
function pins(boosted: boolean, selected: boolean) {
  const classes = ["wz-pin", boosted && "wz-pin-boosted", selected && "wz-pin-selected"].filter(Boolean).join(" ");
  return Object.fromEntries(
    (Object.keys(CATEGORIES) as DealCategory[]).map((key) => [
      key,
      L.divIcon({
        className: "wz-marker",
        html: `<div class="${classes}" style="--pin:${CATEGORIES[key].color}">${categoryIconSvg(key, 20)}</div>`,
        iconSize: [40, 48],
        iconAnchor: [20, 47],
        popupAnchor: [0, -44],
      }),
    ]),
  ) as Record<DealCategory, L.DivIcon>;
}
const ICONS = pins(false, false);
/** Offres mises en avant par un commerçant : contour doré, au-dessus des autres. */
const BOOSTED_ICONS = pins(true, false);
/** Offre choisie dans une liste (recherche, fil) : contour aubergine, au-dessus de tout sauf « Tu es ici ». */
const SELECTED_ICONS = pins(false, true);
const SELECTED_BOOSTED_ICONS = pins(true, true);
/** Niveau de zoom appliqué quand on sélectionne une offre depuis une liste. */
const SELECT_ZOOM = 16;

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
  savedPosition,
  selectedId,
}: {
  deals: DealWithVotes[];
  /** Zone choisie à l'inscription : localisation de repli tant que le GPS n'a pas répondu (ou s'il est refusé). */
  homeZoneId?: string | null;
  /** Position enregistrée par « Me localiser » à l'inscription, préférée au centre de la zone. */
  savedPosition?: { lat: number; lng: number } | null;
  /** Offre choisie dans une liste (recherche, fil) : la carte s'y centre et la met en avant. */
  selectedId?: string | null;
}) {
  const [map, setMap] = useState<L.Map | null>(null);
  const { position, error, retry, consent } = useUserPosition();
  const home = ZONES.find((z) => z.id === homeZoneId);
  const savedLat = savedPosition?.lat;
  const savedLng = savedPosition?.lng;
  const [visible, setVisible] = useState(false);
  /** Bon plan dont la fiche est ouverte */
  const [detail, setDetail] = useState<Deal | null>(null);
  /** La carte est-elle restée sur la localisation de l'étudiant (flèche pleine) ? */
  const [centered, setCentered] = useState(true);
  /** Vrai dès que la vue ne doit plus être recentrée automatiquement. */
  const viewTaken = useRef(false);
  /** Dernière offre sur laquelle la carte s'est centrée : la liste peut changer sans que la carte bouge. */
  const flownTo = useRef<string | null>(null);

  // Next conserve les pages quittées (React <Activity>), mais Leaflet ne sait pas se réattacher :
  // on démonte la carte quand la page est cachée et on la recrée au retour.
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    return () => {
      setVisible(false);
      setMap(null);
      setDetail(null);
      setCentered(true);
      viewTaken.current = false;
      flownTo.current = null;
    };
  }, []);

  /** Vue sur la localisation choisie à l'inscription ; false s'il n'y en a pas. */
  const showChosen = useCallback(() => {
    if (!map) return false;
    // Sans animation : un zoom animé en cours ferait ignorer le centrage sur le GPS arrivé juste après.
    if (savedLat !== undefined && savedLng !== undefined)
      map.setView([savedLat, savedLng], USER_ZOOM - 1, { animate: false });
    else if (home)
      map.fitBounds(L.latLng(home.lat, home.lng).toBounds(Math.max(home.radiusM, 3000) * 2), { animate: false });
    else return false;
    return true;
  }, [map, home, savedLat, savedLng]);

  useEffect(() => {
    if (!position && !viewTaken.current) showChosen();
  }, [showChosen, position]);

  // L'utilisateur a déplacé la carte avant que le GPS réponde : on ne la lui reprend pas.
  useEffect(() => {
    const take = () => {
      viewTaken.current = true;
      setCentered(false);
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
    map.setView([position.lat, position.lng], USER_ZOOM, { animate: false });
  }, [map, position]);

  // Une offre choisie dans une liste (recherche, fil) : on s'y centre et on quitte le suivi GPS.
  useEffect(() => {
    if (!map || !selectedId || flownTo.current === selectedId) return;
    const target = deals.find((d) => d.id === selectedId);
    if (!target || target.lat === null || target.lng === null) return;
    flownTo.current = selectedId;
    viewTaken.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchro avec le choix externe (liste), pas d'alternative sans effet
    setCentered(false);
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), SELECT_ZOOM), { duration: 0.6 });
  }, [map, selectedId, deals]);

  /** Niveau de zoom courant : un bouton est grisé quand on ne peut plus aller plus loin. */
  const [zoom, setZoom] = useState<number | null>(null);
  useEffect(() => {
    if (!map) return;
    const read = () => setZoom(map.getZoom());
    map.on("zoomend", read);
    map.whenReady(read);
    return () => {
      map.off("zoomend", read);
    };
  }, [map]);

  /** Retour à ma position GPS, sinon à la localisation choisie (le GPS est redemandé). */
  function recenter() {
    setCentered(true);
    if (position) {
      viewTaken.current = true;
      map?.flyTo([position.lat, position.lng], USER_ZOOM, { duration: 0.8 });
      return;
    }
    viewTaken.current = false;
    if (!showChosen()) map?.fitBounds(ALL_BOUNDS);
    retry();
  }

  return (
    // `isolate` garde les z-index de Leaflet sous la barre de navigation.
    <div className="relative isolate h-full w-full">
      {visible && (
        <MapContainer ref={setMap} bounds={ALL_BOUNDS} zoomControl={false} maxZoom={19} className="h-full w-full">
          <BaseMap />
          {position && (
            <>
              <Circle
                center={[position.lat, position.lng]}
                radius={position.accuracy}
                interactive={false}
                pathOptions={{ stroke: false, color: "#1e3a2f", fillOpacity: 0.12 }}
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
                icon={(
                  d.id === selectedId
                    ? isBoosted(d) ? SELECTED_BOOSTED_ICONS : SELECTED_ICONS
                    : isBoosted(d) ? BOOSTED_ICONS : ICONS
                )[d.category]}
                zIndexOffset={d.id === selectedId ? 900 : isBoosted(d) ? 500 : 0}
                title={d.title}
                eventHandlers={{ popupopen: () => recordView(d) }}
              >
                <Popup autoPanPaddingTopLeft={[16, 16]} autoPanPaddingBottomRight={[16, 24]} maxHeight={240}>
                  <div className="flex min-w-[16.5rem] flex-col gap-1">
                    <span
                      className="sw-badge self-start"
                      style={{ backgroundColor: "var(--color-sage)", color: "var(--color-forest)" }}
                    >
                      <CategoryIcon category={d.category} size={16} /> {CATEGORIES[d.category].label}
                    </span>
                    <AuthorBadge deal={d} className="self-start" />
                    {isBoosted(d) && (
                      // Explique le repère au contour doré (sinon sans texte, on ne sait pas que c'est une mise en avant payante).
                      <span className="sw-badge self-start" style={{ backgroundColor: "#d4a017", color: "#1A1A18" }}>
                        <SparklesIcon className="h-3.5 w-3.5" /> Sponsorisé
                      </span>
                    )}
                    <strong className="text-base leading-tight">{d.title}</strong>
                    {d.place_name && (
                      <span className="flex items-center gap-1 text-[var(--color-muted)]">
                        <PinIcon className="h-3 w-3" /> {d.place_name}
                      </span>
                    )}
                    {d.expires_at && (
                      <span className="text-xs text-[var(--color-muted)]">Jusqu&apos;au {formatDate(d.expires_at)}</span>
                    )}
                    <div className="mt-1">
                      <QuickReactions deal={d} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetail(d)}
                      className="text-left text-sm font-medium"
                      style={{ color: "var(--color-forest)" }}
                    >
                      Détails ›
                    </button>
                  </div>
                </Popup>
              </Marker>
            ),
          )}
        </MapContainer>
      )}

      {detail && <DealSheet deal={detail} onClose={() => setDetail(null)} />}

      <div className="pointer-events-none absolute bottom-6 left-3 right-3 z-[1000] flex flex-col items-end gap-2 *:pointer-events-auto">
        {error && (
          <p role="alert" className="wz-glass self-stretch rounded-2xl px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {consent !== null && consent !== "granted" && (
          <button type="button" onClick={retry} className="wz-glass rounded-full px-4 py-2 text-sm font-medium" style={{ color: "var(--color-forest)" }}>
            Position non partagée · Activer
          </button>
        )}
        <div className="wz-glass flex flex-col overflow-hidden rounded-full" role="group" aria-label="Zoom de la carte">
          {(
            [
              { label: "Zoomer", sign: "+", run: () => map?.zoomIn(), off: zoom !== null && zoom >= (map?.getMaxZoom() ?? Infinity) },
              { label: "Dézoomer", sign: "−", run: () => map?.zoomOut(), off: zoom !== null && zoom <= (map?.getMinZoom() ?? 0) },
            ] as const
          ).map((b, i) => (
            <button
              key={b.label}
              type="button"
              onClick={b.run}
              disabled={!map || b.off}
              aria-label={b.label}
              title={b.label}
              className="flex h-11 w-13 items-center justify-center text-2xl leading-none transition active:scale-90 disabled:opacity-35"
              style={{ color: "var(--color-forest)", borderTop: i ? "1px solid var(--color-border)" : undefined }}
            >
              <span aria-hidden>{b.sign}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={recenter}
          aria-label="Revenir à ma localisation"
          title="Revenir à ma localisation"
          aria-pressed={centered}
          className={`wz-glass flex h-13 w-13 items-center justify-center rounded-full transition active:scale-95 ${consent === "granted" && !position && !error ? "animate-pulse" : ""}`}
          style={{ color: "var(--color-forest)" }}
        >
          {/* Flèche de localisation : pleine quand la carte est centrée sur soi. */}
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
            <path
              d="M21 3 3 10.5l7.8 2.7L13.5 21 21 3Z"
              fill={centered && position ? "currentColor" : "none"}
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
