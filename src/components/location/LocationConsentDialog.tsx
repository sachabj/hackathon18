"use client";

// Fenêtre d'accord pour la localisation (RGPD) : informer avant, refuser aussi facilement qu'accepter.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LockClosedIcon } from "@/components/icons";
import Modal from "@/components/rewards/Modal";
import { NEARBY_M } from "@/lib/constants";
import { registerConsentDialog, saveLocationConsent } from "@/lib/location";

export default function LocationConsentDialog() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
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
    <Modal label="Partager ta position" onClose={dismiss}>
      <div className="space-y-3 text-sm">
        <h2 className="flex items-center gap-2 text-xl">
          <LockClosedIcon className="h-5 w-5 shrink-0 text-[var(--color-forest)]" /> Partager ta position ?
        </h2>
        <p>
          <strong>Pour quoi faire :</strong> vérifier que tu es à moins de {NEARBY_M} m d&apos;une offre pour gagner des
          Flèches, te situer sur la carte et calculer les distances.
        </p>
        <div className="rounded-2xl p-3" style={{ backgroundColor: "var(--color-sage)" }}>
          <p className="font-medium" style={{ color: "var(--color-forest)" }}>Ta position est sécurisée</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Elle voyage chiffrée (HTTPS).</li>
            <li>Quand tu réagis ou publies, elle est comparée au lieu de l&apos;offre sans être enregistrée.</li>
            <li>Les autres étudiants ne la voient pas, sauf si tu choisis de publier ta position comme lieu d&apos;une offre.</li>
            <li>Seul « Me localiser » (préférences) garde une position arrondie à environ 100 m, lisible par toi seul.</li>
          </ul>
        </div>
        <p>
          C&apos;est facultatif : sans elle, tout fonctionne, mais les offres placées sur la carte ne rapportent pas de
          Flèches. Tu changes d&apos;avis quand tu veux dans Profil, « Ma localisation ».
        </p>
        <Link href="/confidentialite#localisation" target="_blank" className="inline-block underline">
          Politique de confidentialité
        </Link>
        {error && <p role="alert" className="text-red-600">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={busy} onClick={() => answer(false)} className="sw-btn-primary">
            Refuser
          </button>
          <button type="button" disabled={busy} onClick={() => answer(true)} className="sw-btn-primary">
            Accepter
          </button>
        </div>
      </div>
    </Modal>
  );
}
