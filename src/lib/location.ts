// Localisation : accord de l'utilisateur (RGPD) et position ponctuelle. Responsable : Sacha.
// Rien n'est demandé au navigateur sans accord dans l'application, retirable dans Profil > Ma localisation.
// ⚠️ Toute nouvelle utilisation de la position doit passer par ici et figurer dans /confidentialite.
import { useEffect, useState } from "react";
import { forgetPosition } from "./account";
import { NEARBY_M } from "./constants";
import type { Point } from "./geo";
import { getSupabase, isSupabaseConfigured } from "./supabase/client";

/** Date du texte accepté : à changer si les usages de la position changent. */
const CONSENT_VERSION = "2026-11-28";

export type LocationConsent = "granted" | "denied" | "unset";

/** L'accord est gardé avec le compte (choix, date, version) : il suit l'utilisateur d'un appareil à l'autre. */
export async function fetchLocationConsent(): Promise<LocationConsent> {
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  const saved = user?.user_metadata?.location_consent as { allowed?: boolean; version?: string } | undefined;
  if (!saved) return "unset";
  if (!saved.allowed) return "denied";
  // Texte modifié depuis l'accord : on le redemande.
  return saved.version === CONSENT_VERSION ? "granted" : "unset";
}

const EVENT = "sharewood:location";

/** Enregistre le choix ; un refus efface aussi la position enregistrée dans les préférences. */
export async function saveLocationConsent(allowed: boolean) {
  const { data, error } = await getSupabase().auth.updateUser({
    data: { location_consent: { allowed, at: new Date().toISOString(), version: CONSENT_VERSION } },
  });
  if (error) throw new Error(error.message);
  window.dispatchEvent(new Event(EVENT));
  if (!allowed) await forgetPosition(data.user.id);
}

/** Choix actuel, tenu à jour ; null tant qu'il n'est pas connu. */
export function useLocationConsent() {
  const [consent, setConsent] = useState<LocationConsent | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    const read = () =>
      fetchLocationConsent()
        .then((c) => !cancelled && setConsent(c))
        .catch(() => !cancelled && setConsent("unset"));
    read();
    window.addEventListener(EVENT, read);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, read);
    };
  }, []);
  return consent;
}

// ---------- Fenêtre d'accord (components/location/LocationConsentDialog, dans le layout) ----------
let dialog: (() => Promise<boolean>) | null = null;

export function registerConsentDialog(ask: () => Promise<boolean>) {
  dialog = ask;
  return () => {
    if (dialog === ask) dialog = null;
  };
}

/**
 * Vrai si la position peut être utilisée ; sinon la fenêtre d'accord est proposée.
 * `explicit` : l'utilisateur a touché un bouton qui demande sa position, on repropose même après un refus.
 */
export async function ensureLocationConsent(explicit = false): Promise<boolean> {
  const consent = await fetchLocationConsent().catch((): LocationConsent => "unset");
  if (consent === "granted") return true;
  if (consent === "denied" && !explicit) return false;
  return dialog ? dialog() : false;
}

/**
 * Position à un instant donné (réaction, publication), seulement avec l'accord.
 * null si elle est refusée, trop imprécise ou trop longue à obtenir. Arrondie à ~10 m, jamais enregistrée.
 */
export async function currentPosition(timeoutMs = 8000): Promise<Point | null> {
  if (!("geolocation" in navigator) || !(await ensureLocationConsent())) return null;
  return new Promise((resolve) => {
    // Une demande d'autorisation laissée sans réponse ne doit pas bloquer l'action.
    const timer = setTimeout(() => resolve(null), timeoutMs);
    const done = (point: Point | null) => {
      clearTimeout(timer);
      resolve(point);
    };
    const round = (v: number) => Math.round(v * 10_000) / 10_000;
    navigator.geolocation.getCurrentPosition(
      // Au-delà de 500 m d'imprécision, impossible de dire si l'on est sur place.
      ({ coords }) =>
        done(coords.accuracy <= NEARBY_M ? { lat: round(coords.latitude), lng: round(coords.longitude) } : null),
      () => done(null),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 6000 },
    );
  });
}
