"use client";

// « Valider un bon » (tâche 42) : le commerçant saisit le code présenté par l'étudiant, le vérifie puis le valide.
import { useState } from "react";
import { CheckCircleIcon, TicketIcon } from "@/components/icons";
import { checkVoucher, validateVoucher, type Voucher } from "@/lib/merchant";
import { inputClass } from "./styles";
import { dateLocale, useT } from "@/lib/i18n";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(dateLocale(), { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export default function VoucherCheck() {
  const t = useT();
  const [code, setCode] = useState("");
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
    } catch (e) {
      setMessage({ ok: false, text: (e as Error).message });
    }
    setBusy(false);
  }

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const found = await checkVoucher(code);
      setVoucher(found);
      if (!found) setMessage({ ok: false, text: t("Code inconnu : vérifie les caractères (SW- suivi de 6 caractères).") });
    });
  };

  const validate = () =>
    run(async () => {
      if (!voucher) return;
      setVoucher(await validateVoucher(voucher.code));
      setMessage({ ok: true, text: t("Bon validé : il ne pourra plus servir.") });
    });

  return (
    <section className="sw-card mt-4 space-y-3 p-4 lg:max-w-2xl" aria-label={t("Valider un bon")}>
      <h2 className="flex items-center gap-2 text-lg">
        <TicketIcon className="h-5 w-5 text-[var(--color-forest)]" />{" "}{t("Valider un bon")}
      </h2>
      <p className="text-sm text-[var(--color-muted)]">
        {t("L'étudiant présente un bon gagné avec ses Flèches : saisis le code inscrit sous le QR code.")}
      </p>
      <form onSubmit={check} className="flex gap-2">
        <input
          className={`${inputClass} mt-0 font-mono uppercase tracking-widest`}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setVoucher(null);
            setMessage(null);
          }}
          placeholder="SW-XXXXXX"
          maxLength={12}
          autoCapitalize="characters"
          autoComplete="off"
          aria-label={t("Code du bon")}
          required
        />
        <button disabled={busy || code.trim().length < 4} className="sw-btn-primary shrink-0 disabled:opacity-50">
          {t("Vérifier")}
        </button>
      </form>
      {voucher && (
        <div className="space-y-2 rounded-2xl p-3" style={{ backgroundColor: "var(--color-paper)" }}>
          <p className="font-medium">{voucher.title}</p>
          <p className="text-sm text-[var(--color-muted)]">
            {voucher.partner}{" "}{t("· obtenu le")}{" "}{formatDate(voucher.created_at)}
          </p>
          {voucher.used_at ? (
            <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--color-aubergine)" }}>
              <CheckCircleIcon className="h-4 w-4" />{" "}{t("Déjà utilisé le")}{" "}{formatDate(voucher.used_at)}
            </p>
          ) : (
            <button type="button" disabled={busy} onClick={validate} className="sw-btn-primary w-full disabled:opacity-50">
              {t("Valider le bon")}
            </button>
          )}
        </div>
      )}
      {message && (
        <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
