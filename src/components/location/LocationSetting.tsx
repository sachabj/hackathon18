"use client";

// Réglage « Ma localisation » (tâche 49) : donner ou retirer son accord.
import { useState } from "react";
import LocationNotice from "@/components/location/LocationNotice";
import { NEARBY_M } from "@/lib/constants";
import { saveLocationConsent, useLocationConsent } from "@/lib/location";
import { useT } from "@/lib/i18n";

export default function LocationSetting({ student = true, onChange }: { student?: boolean; onChange?: (on: boolean) => void }) {
  const consent = useLocationConsent();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const on = consent === "granted";

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      await saveLocationConsent(!on);
      onChange?.(!on);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <section aria-label={t("Ma localisation")}>
      <h2 className="mb-2 text-lg">{t("Ma localisation")}</h2>
      <div className="sw-card space-y-2 p-3">
        <button
          type="button"
          role="switch"
          aria-checked={on}
          disabled={busy || consent === null}
          onClick={toggle}
          className="flex w-full items-center justify-between gap-3 text-left text-sm font-medium disabled:opacity-60"
        >
          <span>{t("Partager ma position")}</span>
          <span
            aria-hidden
            className="flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors"
            style={{ backgroundColor: on ? "var(--color-forest)" : "var(--color-border)" }}
          >
            <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
          </span>
        </button>
        <p className="text-sm text-[var(--color-muted)]">
          {student
            ? on
              ? t("Activée : à moins de {m} m d'une offre, tu gagnes des Flèches et tu peux la signaler « Plus dispo ». La désactiver efface la position enregistrée.", { m: NEARBY_M })
              : t("Désactivée : les offres placées sur la carte ne rapportent pas de Flèches et ne peuvent pas être signalées « Plus dispo ».")
            : on
              ? t("Activée : tu peux placer ton commerce avec ta position.")
              : t("Désactivée : place ton commerce en touchant la carte.")}
        </p>
        <LocationNotice>{t("Envoyée chiffrée ; nous n'enregistrons pas ta position au moment d'une réaction.")}</LocationNotice>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}
