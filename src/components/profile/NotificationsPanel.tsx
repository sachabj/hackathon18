"use client";

// Réglages des notifications (tâche 68) : seulement dans l'appli ouverte, choix gardés avec le compte.
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { ensureLocationConsent } from "@/lib/location";
import { NEARBY_ALERT_M, saveNotificationSettings, useNotificationSettings, type NotificationSettings } from "@/lib/notifications";

const ALERTS: { key: keyof NotificationSettings; title: string; hint: string }[] = [
  { key: "nearby", title: "Bons plans à proximité", hint: "Quand tu passes à moins de {n} m d'une offre : « toujours dispo ? ». Demande ta position, qui reste sur ton téléphone." },
  { key: "confirmations", title: "Validation de mes offres", hint: "À l'ouverture de l'appli : les « J'en ai profité » reçus par tes bons plans depuis ta dernière visite." },
];

export default function NotificationsPanel() {
  const t = useT();
  const settings = useNotificationSettings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(key: keyof NotificationSettings) {
    if (!settings) return;
    const on = !settings[key];
    setBusy(true);
    setError(null);
    try {
      if (key === "nearby" && on && !(await ensureLocationConsent(true))) {
        throw new Error(t("Sans ta position, impossible de te prévenir près d'une offre."));
      }
      await saveNotificationSettings({ ...settings, [key]: on });
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <>
      <p className="text-sm text-[var(--color-muted)]">
        {t("Les notifications s'affichent quand l'appli est ouverte (pas encore quand elle est fermée).")}
      </p>
      <ul className="space-y-3">
        {ALERTS.map(({ key, title, hint }) => {
          const on = !!settings?.[key];
          return (
            <li key={key}>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                disabled={busy || !settings}
                onClick={() => toggle(key)}
                className="flex w-full items-center justify-between gap-3 text-left disabled:opacity-60"
              >
                <span>
                  <span className="block text-sm font-medium">{t(title)}</span>
                  <span className="block text-xs text-[var(--color-muted)]">{t(hint, { n: NEARBY_ALERT_M })}</span>
                </span>
                <span
                  aria-hidden
                  className="flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors"
                  style={{ backgroundColor: on ? "var(--color-forest)" : "var(--color-border)" }}
                >
                  <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </>
  );
}
