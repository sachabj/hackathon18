"use client";

// Aide : questions fréquentes et message à l'équipe (enregistré en base, migration 022).
import { useState } from "react";
import { Feedback, inputClass, primaryClass, useAction } from "@/components/account/ui";
import { DAILY_PAID_CREATIONS, DAILY_PAID_VOTES } from "@/lib/arrows";
import { sendSupportMessage } from "@/lib/community";
import { NEARBY_M } from "@/lib/constants";
import { BURST_HOURS, BURST_REPORTS, DOUBT_DAYS, DOUBT_REPORTS, RESCUE_CONFIRMATIONS } from "@/lib/rules";
import { useT } from "@/lib/i18n";

/** Question, réponse et variables de la réponse (traduites à l'affichage). */
const QUESTIONS: [string, string, Record<string, number>][] = [
  [
    "Pourquoi je ne gagne pas de Flèches ?",
    "Sur une offre placée sur la carte, il faut partager ta position à moins de {m} m. Il y a aussi {v} votes et {p} publications récompensés par jour.",
    { m: NEARBY_M, v: DAILY_PAID_VOTES, p: DAILY_PAID_CREATIONS },
  ],
  ["Pourquoi « Plus dispo » est refusé ?", "Pour une offre sur la carte, il se signale sur place, à moins de {m} m.", { m: NEARBY_M }],
  [
    "Quand une offre disparaît-elle ?",
    "Quand sa date est passée ou qu'elle est retirée. Après {r} « Plus dispo », elle devient « Douteux » : sans {k} « J'en ai profité » sous {d} jours, elle est retirée. {b} signalements en {h} h la retirent tout de suite.",
    { r: DOUBT_REPORTS, k: RESCUE_CONFIRMATIONS, d: DOUBT_DAYS, b: BURST_REPORTS, h: BURST_HOURS },
  ],
  ["Mon nom est-il visible ?", "Non : les publications sont anonymes.", {}],
];

export default function HelpPanel() {
  const [kind, setKind] = useState<"bug" | "help">("bug");
  const [message, setMessage] = useState("");
  const t = useT();
  const action = useAction();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sent = await action.run(async () => {
      if (message.trim().length < 5) throw new Error(t("Décris ton problème en quelques mots."));
      await sendSupportMessage(kind, message.trim());
      return t("Merci, ton message est enregistré. L'équipe le lira ; il n'y a pas de réponse automatique.");
    });
    if (sent) setMessage("");
  }

  return (
    <>
      <div className="space-y-1">
        {QUESTIONS.map(([question, answer, vars]) => (
          <details key={question} className="text-sm">
            <summary className="cursor-pointer font-medium">{t(question)}</summary>
            <p className="mt-1 text-[var(--color-muted)]">{t(answer, vars)}</p>
          </details>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-3 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
        <label className="block text-sm font-medium">
          {t("Sujet")}
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as "bug" | "help")}>
            <option value="bug">{t("Signaler un bug")}</option>
            <option value="help">{t("Demander de l'aide")}</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          {t("Ton message")}
          <textarea className={inputClass} rows={3} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} required />
        </label>
        <Feedback message={action.message} />
        <button disabled={action.busy} className={primaryClass}>{action.busy ? t("Envoi…") : t("Envoyer")}</button>
      </form>
    </>
  );
}
