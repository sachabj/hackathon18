"use client";

// Bon à présenter : QR code et code, puis « utilisé en caisse ».
import { toString as qrToSvg } from "qrcode";
import { useEffect, useState } from "react";
import { CheckCircleIcon } from "@/components/icons";
import { markRewardUsed, type Reward, type UserReward } from "@/lib/rewards";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

/** QR code du code, dessiné dans le navigateur (aucun service extérieur). */
function QrCode({ value }: { value: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    qrToSvg(value, { type: "svg", margin: 1 }).then(
      (svg) => !cancelled && setUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`),
    );
    return () => {
      cancelled = true;
    };
  }, [value]);
  if (!url) return <div className="h-44 w-44" />;
  // eslint-disable-next-line @next/next/no-img-element -- image générée localement
  return <img src={url} alt={`QR code du bon ${value}`} width={176} height={176} className="rounded-xl bg-white p-1" />;
}

export default function Voucher({
  reward,
  owned,
  onUsed,
}: {
  reward: Reward;
  owned: UserReward;
  /** Prévient la boutique que le bon vient d'être utilisé. */
  onUsed: (updated: UserReward) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [used, setUsed] = useState(owned.used_at);

  async function use() {
    setBusy(true);
    setError(null);
    try {
      const updated = await markRewardUsed(owned.id);
      setUsed(updated.used_at);
      onUsed(updated);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center" style={{ borderColor: used ? "var(--color-border)" : "var(--color-forest)" }}>
      <p className="font-medium">{reward.title}</p>
      <p className="text-sm text-[var(--color-muted)]">{reward.partner}</p>
      {used ? (
        <p className="flex items-center gap-1.5 font-medium text-[var(--color-muted)]">
          <CheckCircleIcon className="h-5 w-5" /> Utilisé le {formatDate(used)}
        </p>
      ) : (
        owned.code && <QrCode value={owned.code} />
      )}
      <p className={`font-mono text-2xl font-medium tracking-widest ${used ? "text-[var(--color-muted)] line-through" : ""}`}>{owned.code}</p>
      {reward.category === "raffle" ? (
        <p className="text-sm">Ton ticket est enregistré pour le tirage au sort. Garde ce numéro.</p>
      ) : (
        !used && (
          <>
            <p className="text-sm">{reward.description} Présente ce bon en caisse.</p>
            {confirming ? (
              <div className="flex w-full flex-col gap-2">
                <p className="text-sm font-medium" style={{ color: "var(--color-aubergine)" }}>
                  À faire devant le commerçant : le bon ne pourra plus servir.
                </p>
                <button type="button" onClick={use} disabled={busy} className="sw-btn-primary w-full">
                  Confirmer : bon utilisé
                </button>
                <button type="button" onClick={() => setConfirming(false)} className="text-sm underline">
                  Pas encore
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirming(true)} className="sw-btn-secondary w-full">
                Marquer comme utilisé en caisse
              </button>
            )}
          </>
        )
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
