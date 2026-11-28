"use client";

// Confirmation d'un échange, puis animation de succès et bon obtenu.
import { useState } from "react";
import { ArrowShotIcon, CheckIcon } from "@/components/icons";
import Modal from "@/components/Modal";
import Voucher from "@/components/rewards/Voucher";
import { redeemReward, type Reward, type UserReward } from "@/lib/rewards";
import { useT } from "@/lib/i18n";

export default function RedeemDialog({
  reward,
  balance,
  onClose,
  onChange,
}: {
  reward: Reward;
  balance: number;
  onClose: () => void;
  /** Un échange ou une utilisation a eu lieu : relire la boutique. */
  onChange: () => void;
}) {
  const t = useT();
  const [done, setDone] = useState<UserReward | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Solde au moment d'ouvrir : il ne change pas sous les yeux après l'échange.
  const [before] = useState(balance);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      setDone(await redeemReward(reward.id));
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <Modal label={done ? t("Échange réussi") : t("Confirmer l'échange")} onClose={onClose}>
      {done ? (
        <div className="space-y-3 text-center">
          <div className="sw-success mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}>
            <CheckIcon className="h-9 w-9" />
          </div>
          <h2 className="text-xl" role="status">{t("Échange réussi !")}</h2>
          {done.code ? (
            <>
              <Voucher reward={reward} owned={done} />
              <p className="text-sm text-[var(--color-muted)]">{t("Tu le retrouveras dans « Mes bons ».")}</p>
            </>
          ) : (
            <p>
              <strong>{t(reward.title)}</strong> {t(reward.effect === "early_access" ? "est activé sur ton compte pour 7 jours." : "est activé sur ton compte.")}
            </p>
          )}
          <button type="button" onClick={onClose} className="sw-btn-primary w-full">{t("Terminé")}</button>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xl">{t(reward.title)}</h2>
          <p className="text-sm text-[var(--color-muted)]">{reward.partner}</p>
          <p className="text-sm">{t(reward.description)}</p>
          <dl className="space-y-1 rounded-2xl p-3 text-sm" style={{ backgroundColor: "var(--color-paper)" }}>
            <div className="flex justify-between"><dt>{t("Disponibles")}</dt><dd className="tabular-nums">{before}</dd></div>
            <div className="flex justify-between"><dt>{t("Coût")}</dt><dd className="tabular-nums">- {reward.cost}</dd></div>
            <div className="flex justify-between font-medium"><dt>{t("Il te restera")}</dt><dd className="tabular-nums">{before - reward.cost}</dd></div>
          </dl>
          <p className="text-xs text-[var(--color-muted)]">{t("Un échange est définitif. Ton grade ne baisse pas.")}</p>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="button" onClick={confirm} disabled={busy} className="sw-btn-primary w-full">
            <ArrowShotIcon className="h-4 w-4" /> {busy ? t("Échange en cours…") : t("Confirmer pour {n} Flèches", { n: reward.cost })}
          </button>
          <button type="button" onClick={onClose} className="sw-btn-secondary w-full">{t("Annuler")}</button>
        </div>
      )}
    </Modal>
  );
}
