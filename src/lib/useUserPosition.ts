"use client";

import { useEffect, useState } from "react";
import { ensureLocationConsent, useLocationConsent } from "./location";

/** La carte ne repropose pas la fenêtre d'accord à chaque retour : un bouton reste disponible. */
let proposed = false;

export interface UserPosition {
  lat: number;
  lng: number;
  /** Précision en mètres */
  accuracy: number;
}

/**
 * Position GPS de l'utilisateur, suivie tant que la page est ouverte, avec son accord seulement
 * (la fenêtre d'accord est proposée s'il n'a jamais répondu). Elle reste dans le navigateur : rien n'est enregistré.
 * `retry()` relance la demande après une erreur ou un refus.
 */
export function useUserPosition() {
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const consent = useLocationConsent();

  useEffect(() => {
    if (consent !== "unset" || proposed) return;
    proposed = true;
    ensureLocationConsent();
  }, [consent]);

  useEffect(() => {
    if (consent !== "granted") return;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy });
        setError(null);
      },
      (e) =>
        setError(
          e.code === e.PERMISSION_DENIED
            ? "Localisation refusée : autorise-la dans les réglages du navigateur."
            : "Position introuvable pour le moment.",
        ),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [attempt, consent]);

  function retry() {
    if (consent !== "granted") {
      ensureLocationConsent(true);
      return;
    }
    setError(null);
    setAttempt((n) => n + 1);
  }

  const on = consent === "granted";
  return { position: on ? position : null, error: on ? error : null, retry, consent };
}
