"use client";

import { useEffect, useState } from "react";

export interface UserPosition {
  lat: number;
  lng: number;
  /** Précision en mètres */
  accuracy: number;
}

/**
 * Position GPS de l'utilisateur, suivie tant que la page est ouverte (demande l'autorisation).
 * Elle reste dans le navigateur : rien n'est enregistré.
 * `retry()` relance la demande après une erreur.
 */
export function useUserPosition() {
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
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
  }, [attempt]);

  function retry() {
    setError(null);
    setAttempt((n) => n + 1);
  }

  return { position, error, retry };
}
