"use client";

// Confirmation d'un échange, puis animation de succès et bon obtenu.
import { useState } from "react";
import { ArrowShotIcon, CheckIcon } from "@/components/icons";
import Modal from "@/components/rewards/Modal";
import Voucher from "@/components/rewards/Voucher";
import { redeemReward, type Reward, type UserReward } from "@/lib/rewards";

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
    <Modal label={done ? "Échange réussi" : "Confirmer l'échange"} onClose={onClose}>
      {done ? (
        <div className="space-y-3 text-center">
          <div className="sw-success mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}>
            <CheckIcon className="h-9 w-9" />
          </div>
          <h2 className="text-xl" role="status">Échange réussi !</h2>
          {done.code ? (
            <>
              <Voucher reward={reward} owned={done} onUsed={onChange} />
              <p className="text-sm text-[var(--color-muted)]">Tu le retrouveras dans « Mes bons ».</p>
            </>
          ) : (
            <p>
              <strong>{reward.title}</strong> est activé sur ton compte
              {reward.effect === "early_access" ? " pour 7 jours." : "."}
            </p>
          )}
          <button type="button" onClick={onClose} className="sw-btn-primary w-full">Terminé</button>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xl">{reward.title}</h2>
          <p className="text-sm text-[var(--color-muted)]">{reward.partner}</p>
          <p className="text-sm">{reward.description}</p>
          <dl className="space-y-1 rounded-2xl p-3 text-sm" style={{ backgroundColor: "var(--color-paper)" }}>
            <div className="flex justify-between"><dt>Disponibles</dt><dd className="tabular-nums">{before}</dd></div>
            <div className="flex justify-between"><dt>Coût</dt><dd className="tabular-nums">- {reward.cost}</dd></div>
            <div className="flex justify-between font-medium"><dt>Il te restera</dt><dd className="tabular-nums">{before - reward.cost}</dd></div>
          </dl>
          <p className="text-xs text-[var(--color-muted)]">Un échange est définitif. Ton rang ne baisse pas.</p>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="button" onClick={confirm} disabled={busy} className="sw-btn-primary w-full">
            <ArrowShotIcon className="h-4 w-4" /> {busy ? "Échange en cours…" : `Confirmer pour ${reward.cost} Flèches`}
          </button>
          <button type="button" onClick={onClose} className="sw-btn-secondary w-full">Annuler</button>
        </div>
      )}
    </Modal>
  );
}
