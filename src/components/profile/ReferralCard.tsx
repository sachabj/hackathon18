"use client";

// Parrainage (migration 022) : code, lien, partage et compteurs.
import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon, ShareIcon } from "@/components/icons";
import { onArrows } from "@/lib/arrows";
import { fetchReferrals, REFERRAL, referralLink, type Referrals } from "@/lib/community";
import { copyText, shareOrCopy } from "@/lib/share";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";

export default function ReferralCard() {
  const t = useT();
  const [data, setData] = useState<Referrals | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"copied" | "failed" | null>(null);

  // Relu à chaque retour sur la page (Next conserve l'état).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    const load = () =>
      fetchReferrals()
        .then((r) => !cancelled && setData(r))
        .catch((e: Error) => !cancelled && setError(e.message));
    load();
    const stop = onArrows(load);
    return () => {
      cancelled = true;
      stop();
      setStatus(null);
    };
  }, []);

  // « Copié ! » ne reste que quelques secondes.
  useEffect(() => {
    if (status !== "copied") return;
    const timer = setTimeout(() => setStatus(null), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  if (error) return <p className="text-sm text-amber-700">{t("Parrainage indisponible.")} {error}</p>;
  // Sans la migration 022 : rien à montrer.
  if (!data?.referral_code) return null;
  // Les données ne sont lues que dans le navigateur : l'adresse du site y est connue.
  const link = referralLink(data.referral_code);

  const copy = async () => setStatus((await copyText(link)) ? "copied" : "failed");
  async function share() {
    const result = await shareOrCopy({
      title: "ShareWood",
      text: t("Rejoins ShareWood, les bons plans entre étudiants, avec mon code {code}.", { code: data!.referral_code }),
      url: link,
    });
    setStatus(result === "copied" || result === "failed" ? result : null);
  }

  return (
    <section aria-label={t("Inviter des amis")} className="sw-card space-y-3 p-4" style={{ backgroundColor: "var(--color-sage)" }}>
      <div>
        <h2 className="text-lg" style={{ color: "var(--color-forest)" }}>{t("Invite tes potes, gagnez des Flèches ensemble")}</h2>
        <p className="mt-1 text-sm">
          <strong>{t("+{n} Flèches", { n: REFERRAL.referrer })}</strong>{" "}
          {t("pour toi et +{b} pour ton ami, dès sa première publication ou réaction ({max} amis récompensés au maximum).", { b: REFERRAL.referee, max: REFERRAL.maxPaid })}
        </p>
      </div>
      <p className="flex items-baseline justify-between gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "var(--color-surface)" }}>
        <span className="text-sm text-[var(--color-muted)]">{t("Ton code")}</span>
        <strong className="break-all text-lg tracking-wide">{data.referral_code}</strong>
      </p>
      <input readOnly value={link} aria-label={t("Ton lien de parrainage")} onFocus={(e) => e.target.select()} className="sw-field text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={copy} className="sw-btn-secondary" style={{ backgroundColor: "var(--color-surface)", paddingInline: "0.5rem", fontSize: "0.875rem" }}>
          {status === "copied" ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
          {status === "copied" ? t("Copié !") : t("Copier le lien")}
        </button>
        <button type="button" onClick={share} className="sw-btn-primary" style={{ paddingInline: "0.5rem", fontSize: "0.875rem" }}>
          <ShareIcon className="h-4 w-4" /> {t("Partager")}
        </button>
      </div>
      <p role="status" className="sr-only">{status === "copied" ? t("Lien copié") : ""}</p>
      {status === "failed" && <p role="alert" className="text-sm">{t("Copie impossible : sélectionne le lien ci-dessus.")}</p>}
      <dl className="grid grid-cols-2 gap-2 text-center">
        {[
          [data.friends, t(data.friends > 1 ? "amis parrainés" : "ami parrainé")],
          [data.arrows, t("Flèches gagnées")],
        ].map(([value, label]) => (
          <div key={label} className="flex flex-col-reverse rounded-xl py-2" style={{ backgroundColor: "var(--color-surface)" }}>
            <dt className="text-xs text-[var(--color-muted)]">{label}</dt>
            <dd className="text-2xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {data.pending > 0 && (
        <p className="text-sm">
          {t(data.pending > 1 ? "{n} amis inscrits, pas encore actifs." : "{n} ami inscrit, pas encore actif.", { n: data.pending })}
        </p>
      )}
    </section>
  );
}
