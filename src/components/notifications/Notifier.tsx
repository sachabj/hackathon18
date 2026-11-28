"use client";

// Notifications dans l'appli ouverte (tâche 68), montées dans le layout :
//  - à l'ouverture, les « J'en ai profité » reçus par ses offres depuis la dernière visite ;
//  - « Bons plans à proximité » : la notification « toujours dispo ? » quand on passe à moins de 150 m d'une offre.
// La position reste dans le navigateur (comparée aux offres déjà chargées), rien n'est envoyé ni enregistré.
import { useEffect, useRef } from "react";
import { distanceKm } from "@/lib/geo";
import { useLocationConsent } from "@/lib/location";
import { notifyNearby } from "@/lib/nearby";
import { announceNewConfirmations, NEARBY_ALERT_M, useNotificationSettings } from "@/lib/notifications";
import { useCurrentUserId } from "@/lib/useCurrentUserId";
import { useDeals } from "@/lib/useDeals";

/** Une seule annonce des confirmations par chargement de l'appli. */
let confirmationsChecked = false;
/** Offres déjà proposées pendant cette session, et heure de la dernière notification. */
const proposed = new Set<string>();
let lastAlertAt = 0;
const ALERT_GAP_MS = 10 * 60_000;

export default function Notifier() {
  const settings = useNotificationSettings();
  const consent = useLocationConsent();

  useEffect(() => {
    if (!settings?.confirmations || confirmationsChecked) return;
    confirmationsChecked = true;
    announceNewConfirmations().catch((e: Error) => console.warn("Confirmations non vérifiées :", e.message));
  }, [settings?.confirmations]);

  return settings?.nearby && consent === "granted" ? <NearbyWatcher /> : null;
}

function NearbyWatcher() {
  const { deals } = useDeals();
  const userId = useCurrentUserId();
  const latest = useRef({ deals, userId });
  useEffect(() => {
    latest.current = { deals, userId };
  }, [deals, userId]);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (coords.accuracy > NEARBY_ALERT_M * 2 || Date.now() - lastAlertAt < ALERT_GAP_MS) return;
        const { deals: list, userId: me } = latest.current;
        const here = { lat: coords.latitude, lng: coords.longitude };
        const near = list
          .filter(
            (d) =>
              d.lat !== null &&
              d.lng !== null &&
              d.author_id !== me &&
              !proposed.has(d.id) &&
              // Déjà donné son avis : rien à demander.
              !(d.votes ?? []).some((v) => v.user_id === me),
          )
          .map((d) => ({ d, m: distanceKm(here, { lat: d.lat!, lng: d.lng! }) * 1000 }))
          .filter((x) => x.m <= NEARBY_ALERT_M)
          .sort((a, b) => a.m - b.m)[0];
        if (!near) return;
        proposed.add(near.d.id);
        lastAlertAt = Date.now();
        notifyNearby(near.d);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);
  return null;
}
