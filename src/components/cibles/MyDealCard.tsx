"use client";

import { useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";
import { ArrowShotIcon, ChevronDownIcon, EditIcon, ProhibitedIcon, TrashIcon, UndoIcon } from "@/components/icons";
import { DAILY_PAID_CREATIONS } from "@/lib/arrows";
import { REQUIREMENTS, NEARBY_M, TITLE_MAX } from "@/lib/constants";
import type { MyDealInput } from "@/lib/engagement";
import { normalizeLink } from "@/lib/links";
import { DOUBT_DAYS, RESCUE_CONFIRMATIONS } from "@/lib/rules";
import type { Deal, DealAudience, DealRequirement } from "@/lib/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
/** Date ISO → valeur d'un champ date (jour local). */
const toDay = (iso: string) => new Date(iso).toLocaleDateString("sv-SE");

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

const actionClass = "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium disabled:opacity-50";
const inputClass = "sw-field mt-1 text-base";

/** Flèches rapportées par un de ses bons plans ; `create` à 0 : publié loin du lieu ou au-delà du plafond du jour. */
export type DealGains = { create?: number; bonus?: number };

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/**
 * Un de mes bons plans, en une ligne (titre, état, Flèches) ; toucher la ligne montre l'audience,
 * la modification, le retrait et la suppression.
 */
export default function MyDealCard({
  deal,
  audience,
  gains,
  userId,
  now,
  busy,
  onSave,
  onToggleEnded,
  onDelete,
}: {
  deal: Deal;
  audience: DealAudience | null;
  /** Absent : pas de Flèches pour ce bon plan (ou migration 016 absente). */
  gains?: DealGains;
  userId: string;
  now: number;
  busy: boolean;
  onSave: (input: MyDealInput) => Promise<boolean>;
  onToggleEnded: () => void;
  onDelete: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(deal.title);
  const [description, setDescription] = useState(deal.description ?? "");
  const [lastDay, setLastDay] = useState(deal.expires_at ? toDay(deal.expires_at) : "");
  const [requirements, setRequirements] = useState<DealRequirement[]>(deal.requirements ?? []);
  const [link, setLink] = useState(deal.link_url ?? "");
  const [linkError, setLinkError] = useState<string | null>(null);

  const byMerchant = !!deal.ended_by && deal.ended_by !== userId;
  const expired = !!deal.expires_at && new Date(deal.expires_at).getTime() < now;
  const status = byMerchant
    ? "Retiré par un commerçant"
    : deal.archived_at
      ? "Retiré : signalé « Plus dispo »"
      : deal.ended_by_merchant
        ? "Plus dispo"
        : expired
          ? "Expiré"
          : "En ligne";

  function startEdit() {
    setTitle(deal.title);
    setDescription(deal.description ?? "");
    setLastDay(deal.expires_at ? toDay(deal.expires_at) : "");
    setRequirements(deal.requirements ?? []);
    setLink(deal.link_url ?? "");
    setLinkError(null);
    setMode("edit");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    let link_url: string | null;
    try {
      link_url = normalizeLink(link);
    } catch (err) {
      return setLinkError((err as Error).message);
    }
    setLinkError(null);
    const saved = await onSave({
      title: title.trim(),
      description: description.trim() || null,
      // Valable jusqu'à la fin du dernier jour ; on ne touche pas à l'heure si le jour est inchangé.
      expires_at: !lastDay
        ? null
        : deal.expires_at && toDay(deal.expires_at) === lastDay
          ? deal.expires_at
          : new Date(`${lastDay}T23:59:59`).toISOString(),
      // Colonnes de la migration 012 : envoyées seulement si quelque chose a changé.
      ...(!sameList(requirements, deal.requirements ?? []) && { requirements }),
      ...(link_url !== (deal.link_url ?? null) && { link_url }),
    });
    if (saved) setMode("view");
  }

  if (mode === "edit") {
    return (
      <form onSubmit={submit} className="sw-card space-y-3 p-3" style={{ borderColor: "var(--color-forest)", borderWidth: 2 }}>
        <label className="block text-sm font-medium">
          Titre
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_MAX} required />
        </label>
        <label className="block text-sm font-medium">
          Détails
          <textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </label>
        <label className="block text-sm font-medium">
          Dernier jour
          <input type="date" className={inputClass} value={lastDay} onChange={(e) => setLastDay(e.target.value)} />
        </label>
        <fieldset>
          <legend className="text-sm font-medium">Conditions</legend>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {(Object.keys(REQUIREMENTS) as DealRequirement[]).map((r) => {
              const { Icon, label } = REQUIREMENTS[r];
              const on = requirements.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setRequirements(on ? requirements.filter((x) => x !== r) : [...requirements, r])}
                  className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                  style={
                    on
                      ? { borderColor: "var(--color-forest)", backgroundColor: "var(--color-sage)", color: "var(--color-forest)", fontWeight: 500 }
                      : { borderColor: "var(--color-border)" }
                  }
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="block text-sm font-medium">
          Lien vers l&apos;offre
          <input
            className={inputClass}
            type="text"
            inputMode="url"
            placeholder="https://www.exemple.fr/offre"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            maxLength={500}
          />
        </label>
        {linkError && <p className="text-sm text-red-600">{linkError}</p>}
        <div className="flex gap-2">
          <button disabled={busy} className="sw-btn-primary">Enregistrer</button>
          <button type="button" onClick={() => setMode("view")} className="sw-btn-secondary">Annuler</button>
        </div>
      </form>
    );
  }

  const earned = (gains?.create ?? 0) + (gains?.bonus ?? 0);
  const panelId = `bon-plan-${deal.id}`;
  /** Signalé « Plus dispo » : il reste en ligne jusqu'à l'échéance. */
  const doubtful = status === "En ligne" && !!deal.doubtful_since;
  const deadline = doubtful ? new Date(new Date(deal.doubtful_since!).getTime() + DOUBT_DAYS * 86_400_000).toISOString() : null;

  return (
    <article className="sw-card">
      <h3>
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            setMode("view");
          }}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-2 p-3 text-left font-sans text-sm font-medium leading-snug"
        >
          <CategoryIcon category={deal.category} size={20} />
          <span className="min-w-0 flex-1">{deal.title}</span>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs"
            style={
              doubtful
                ? { backgroundColor: "var(--color-lilac)", color: "var(--color-aubergine)" }
                : status === "En ligne"
                ? { backgroundColor: "var(--color-sage)", color: "var(--color-forest)" }
                : { backgroundColor: "var(--color-border)", color: "var(--color-muted)" }
            }
          >
            {/* Le motif complet est donné une fois la ligne ouverte. */}
            {deal.archived_at || byMerchant ? "Retiré" : doubtful ? "Douteux" : status}
          </span>
          {earned > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 tabular-nums" style={{ color: "var(--color-forest)" }}>
              +{earned}
              <ArrowShotIcon className="h-3.5 w-3.5" />
              <span className="sr-only">Flèches</span>
            </span>
          )}
          <ChevronDownIcon className={`h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </h3>
      {open && (
        <div id={panelId} className="space-y-2 border-t p-3 text-sm" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-[var(--color-muted)]">
            {[
              `Publié le ${formatDate(deal.created_at)}`,
              deal.expires_at && `jusqu'au ${formatDate(deal.expires_at)}`,
              (deal.archived_at || byMerchant) && status.toLowerCase(),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {deadline && (
            <p style={{ color: "var(--color-aubergine)" }}>
              Douteux : sans {RESCUE_CONFIRMATIONS} « J&apos;en ai profité » d&apos;ici le {formatDate(deadline)}, il sera retiré.
            </p>
          )}
          {audience && (
            <p>
              {[
                plural(audience.views, "vue"),
                `${audience.confirmations} « J'en ai profité »`,
                plural(audience.favorites, "favori"),
                audience.reports > 0 && `${audience.reports} « Plus dispo »`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {gains?.create === 0 ? (
            <p className="text-[var(--color-muted)]">
              {deal.lat !== null && deal.lng !== null
                ? `Sans Flèches : publié sans position vérifiée à moins de ${NEARBY_M} m du lieu, ou au-delà de ${DAILY_PAID_CREATIONS} publications récompensées le même jour.`
                : `Publié au-delà de ${DAILY_PAID_CREATIONS} bons plans le même jour : sans Flèches.`}
            </p>
          ) : (
            !!gains?.bonus && (
              <p className="text-[var(--color-muted)]">
                Flèches : {gains.create ?? 0} à la publication, {gains.bonus} grâce aux 3 confirmations.
              </p>
            )
          )}

      {mode === "delete" ? (
        <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: "var(--color-lilac)" }}>
          <p>Supprimer définitivement ce bon plan, avec ses votes et ses favoris ?</p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={busy} onClick={onDelete} className="sw-btn-primary" style={{ backgroundColor: "#b91c1c" }}>Supprimer</button>
            <button type="button" onClick={() => setMode("view")} className="sw-btn-secondary">Annuler</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={startEdit} className={actionClass} style={{ borderColor: "var(--color-border)" }}>
            <EditIcon className="h-4 w-4" /> Modifier
          </button>
          {!byMerchant && (
            <button type="button" disabled={busy} onClick={onToggleEnded} className={actionClass} style={{ borderColor: "var(--color-border)" }}>
              {deal.ended_by_merchant ? (
                <>
                  <UndoIcon className="h-4 w-4" /> Remettre en ligne
                </>
              ) : (
                <>
                  <ProhibitedIcon className="h-4 w-4" /> Plus dispo
                </>
              )}
            </button>
          )}
          <button type="button" disabled={busy} onClick={() => setMode("delete")} className={actionClass} style={{ borderColor: "#fca5a5", color: "#dc2626" }}>
            <TrashIcon className="h-4 w-4" /> Supprimer
          </button>
        </div>
      )}
        </div>
      )}
    </article>
  );
}
