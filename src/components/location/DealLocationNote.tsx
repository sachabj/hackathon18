"use client";

// Sous les boutons de réaction de la fiche : ce que la position permet sur cette offre.
import LocationNotice from "@/components/location/LocationNotice";
import { NEARBY_M } from "@/lib/constants";
import { ensureLocationConsent, useLocationConsent } from "@/lib/location";
import { useT } from "@/lib/i18n";

export default function DealLocationNote({ placed }: { placed: boolean }) {
  const consent = useLocationConsent();
  const t = useT();
  if (!placed) {
    return <p className="mt-2 text-center text-xs text-[var(--color-muted)]">{t("Offre sans lieu précis : moins de Flèches.")}</p>;
  }
  if (consent === null) return null;
  if (consent === "granted") {
    return (
      <LocationNotice className="mt-2">
        {t("Flèches et « Plus dispo » à moins de {m} m : ta position est envoyée chiffrée, sans être enregistrée.", { m: NEARBY_M })}
      </LocationNotice>
    );
  }
  return (
    <p className="mt-2 text-center text-xs text-[var(--color-muted)]">
      {t("Sans ta position : pas de Flèches, et pas de « Plus dispo ».")}{" "}
      <button type="button" onClick={() => ensureLocationConsent(true)} className="font-medium underline" style={{ color: "var(--color-forest)" }}>
        {t("Activer ma position")}
      </button>
    </p>
  );
}
