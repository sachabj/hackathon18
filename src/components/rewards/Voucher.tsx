"use client";

// Bon à présenter : QR code et code ; le commerçant le valide depuis son espace (tâche 42).
import { toString as qrToSvg } from "qrcode";
import { useEffect, useState } from "react";
import { CheckCircleIcon } from "@/components/icons";
import type { Reward, UserReward } from "@/lib/rewards";
import { dateLocale, tr, useT } from "@/lib/i18n";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(dateLocale(), { day: "numeric", month: "long" });

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
  return <img src={url} alt={tr("QR code du bon {code}", { code: value })} width={176} height={176} className="rounded-xl bg-white p-1" />;
}

export default function Voucher({ reward, owned }: { reward: Reward; owned: UserReward }) {
  const t = useT();
  const used = owned.used_at;

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center" style={{ borderColor: used ? "var(--color-border)" : "var(--color-forest)" }}>
      <p className="font-medium">{t(reward.title)}</p>
      <p className="text-sm text-[var(--color-muted)]">{reward.partner}</p>
      {used ? (
        <p className="flex items-center gap-1.5 font-medium text-[var(--color-muted)]">
          <CheckCircleIcon className="h-5 w-5" /> {t("Utilisé le {date}", { date: formatDate(used) })}
        </p>
      ) : (
        owned.code && <QrCode value={owned.code} />
      )}
      <p className={`font-mono text-2xl font-medium tracking-widest ${used ? "text-[var(--color-muted)] line-through" : ""}`}>{owned.code}</p>
      {reward.category === "raffle" ? (
        <p className="text-sm">{t("Ton ticket est enregistré pour le tirage au sort. Garde ce numéro.")}</p>
      ) : (
        !used && (
          <>
            <p className="text-sm">{t(reward.description)}</p>
            <p className="text-sm font-medium" style={{ color: "var(--color-forest)" }}>
              {t("Présente ce code en caisse : le commerçant le valide depuis son espace, une seule fois.")}
            </p>
          </>
        )
      )}
    </div>
  );
}
