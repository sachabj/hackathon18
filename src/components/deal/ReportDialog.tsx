"use client";

// Signaler un bon plan (tâche 71) : motif, description (obligatoire pour « Autre »), puis confirmation.
import { useState } from "react";
import Modal from "@/components/Modal";
import { CheckCircleIcon, WarningIcon } from "@/components/icons";
import { useT } from "@/lib/i18n";
import { REPORT_DETAILS_MAX, REPORT_OTHER_MIN, REPORT_REASONS, reportDeal, type ReportReason } from "@/lib/reports";

export default function ReportDialog({
  dealId,
  onCancel,
  onDone,
}: {
  dealId: string;
  /** Fermée sans rien envoyer. */
  onCancel: () => void;
  /** Fermée après l'envoi : la fiche se ferme et l'offre disparaît. */
  onDone: () => void;
}) {
  const t = useT();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ sent: boolean } | null>(null);

  const needsText = reason === "other" && details.trim().length < REPORT_OTHER_MIN;
  const canSend = reason !== null && !needsText && !busy;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await reportDeal(dealId, reason, details));
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  if (result) {
    return (
      <Modal label={t("Signalement envoyé")} onClose={onDone}>
        <div role="status" className="flex flex-col items-center px-2 pb-2 text-center">
          <span
            className="sw-success flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: result.sent ? "var(--color-sage)" : "var(--color-lilac)", color: result.sent ? "var(--color-forest)" : "var(--color-aubergine)" }}
          >
            {result.sent ? <CheckCircleIcon className="h-8 w-8" /> : <WarningIcon className="h-7 w-7" />}
          </span>
          <h2 className="mt-3 text-xl">{result.sent ? t("Signalement envoyé, merci") : t("Signalement pas encore envoyé")}</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {result.sent
              ? t("L'équipe va le regarder. Ce bon plan ne s'affichera plus pour toi.")
              : t("La connexion avec l'équipe a échoué : réessaie plus tard. Ce bon plan ne s'affichera plus sur cet appareil.")}
          </p>
          <button type="button" onClick={onDone} className="sw-btn-primary mt-5 w-full">
            {t("Fermer")}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal label={t("Signaler ce bon plan")} onClose={onCancel}>
      <form onSubmit={send} className="px-1">
        <h2 className="text-xl">{t("Signaler ce bon plan")}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t("Pour une offre qui n'existe plus, utilise plutôt « Plus dispo ». Ton signalement est anonyme pour l'auteur.")}
        </p>
        <fieldset className="mt-4 space-y-2">
          <legend className="sw-eyebrow mb-2">{t("Ce qui ne va pas")}</legend>
          {REPORT_REASONS.map((r) => {
            const on = reason === r.id;
            return (
              <label
                key={r.id}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-sm font-medium transition"
                style={{
                  borderColor: on ? "var(--color-forest)" : "var(--color-border)",
                  backgroundColor: on ? "var(--color-sage)" : undefined,
                }}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r.id}
                  checked={on}
                  onChange={() => setReason(r.id)}
                  className="h-4 w-4 accent-[var(--color-forest)]"
                />
                {t(r.label)}
              </label>
            );
          })}
        </fieldset>
        <label className="mt-4 block text-sm font-medium">
          {reason === "other" ? t("Explique en quelques mots") : t("Précisions (facultatif)")}
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value.slice(0, REPORT_DETAILS_MAX))}
            rows={3}
            maxLength={REPORT_DETAILS_MAX}
            required={reason === "other"}
            placeholder={t("Ex. : le lien mène vers un autre site, le prix annoncé est faux…")}
            className="sw-field mt-1 w-full resize-none"
          />
          <span className="mt-0.5 block text-right text-xs font-normal text-[var(--color-muted)] tabular-nums">
            {details.length} / {REPORT_DETAILS_MAX}
          </span>
        </label>
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {t(error)}
          </p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} className="sw-btn-secondary w-full">
            {t("Annuler")}
          </button>
          <button type="submit" disabled={!canSend} className="sw-btn-primary w-full disabled:opacity-50">
            {busy ? t("Envoi…") : t("Envoyer")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
