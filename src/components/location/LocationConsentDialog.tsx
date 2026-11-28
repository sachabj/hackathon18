"use client";

// Fenêtre d'accord pour la localisation (RGPD) : informer avant, refuser aussi facilement qu'accepter.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LockClosedIcon } from "@/components/icons";
import Modal from "@/components/Modal";
import { NEARBY_M } from "@/lib/constants";
import { registerConsentDialog, saveLocationConsent } from "@/lib/location";
import { useT } from "@/lib/i18n";

export default function LocationConsentDialog() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  /** Demandes en attente d'une réponse (une seule fenêtre pour toutes). */
  const waiting = useRef<((allowed: boolean) => void)[]>([]);

  useEffect(
    () =>
      registerConsentDialog(
        () =>
          new Promise<boolean>((resolve) => {
            waiting.current.push(resolve);
            setError(null);
            setOpen(true);
          }),
      ),
    [],
  );

  const close = useCallback((allowed: boolean) => {
    setOpen(false);
    setBusy(false);
    waiting.current.splice(0).forEach((resolve) => resolve(allowed));
  }, []);
  /** Fermer sans répondre : rien n'est enregistré, la question reviendra. */
  const dismiss = useCallback(() => close(false), [close]);

  async function answer(allowed: boolean) {
    setBusy(true);
    setError(null);
    try {
      await saveLocationConsent(allowed);
      close(allowed);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <Modal label={t("Partager ta position")} onClose={dismiss}>
      <div className="space-y-3 text-sm">
        <h2 className="flex items-center gap-2 text-xl">
          <LockClosedIcon className="h-5 w-5 shrink-0 text-[var(--color-forest)]" /> {t("Partager ta position ?")}
        </h2>
        <p>
          <strong>{t("Pour quoi faire :")}</strong>{" "}
          {t("vérifier que tu es à moins de {m} m d'une offre pour gagner des Flèches ou la signaler « Plus dispo », te situer sur la carte et calculer les distances.", { m: NEARBY_M })}
        </p>
        <div className="rounded-2xl p-3" style={{ backgroundColor: "var(--color-sage)" }}>
          <p className="font-medium" style={{ color: "var(--color-forest)" }}>{t("Ta position est sécurisée")}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>{t("Elle voyage chiffrée (HTTPS).")}</li>
            <li>{t("Quand tu réagis ou publies, elle est comparée au lieu de l'offre sans être enregistrée.")}</li>
            <li>{t("Les autres étudiants ne la voient pas, sauf si tu choisis de publier ta position comme lieu d'une offre.")}</li>
            <li>{t("Seul « Me localiser » (préférences) garde une position arrondie à environ 100 m, lisible par toi seul.")}</li>
          </ul>
        </div>
        <p>
          {t("C'est facultatif : sans elle, l'application fonctionne, mais les offres placées sur la carte ne rapportent pas de Flèches et tu ne peux pas les signaler « Plus dispo ». Tu changes d'avis quand tu veux dans Profil, « Ma localisation ».")}
        </p>
        <Link href="/confidentialite#localisation" target="_blank" className="inline-block underline">
          {t("Politique de confidentialité")}
        </Link>
        {error && <p role="alert" className="text-red-600">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={busy} onClick={() => answer(false)} className="sw-btn-primary">
            {t("Refuser")}
          </button>
          <button type="button" disabled={busy} onClick={() => answer(true)} className="sw-btn-primary">
            {t("Accepter")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
