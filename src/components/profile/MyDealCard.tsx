"use client";

import { useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";
import { EditIcon, EyeIcon, HeartIcon, ProhibitedIcon, ThumbsDownIcon, ThumbsUpIcon, TrashIcon, UndoIcon, WalkIcon } from "@/components/icons";
import { REQUIREMENTS } from "@/lib/constants";
import type { MyDealInput } from "@/lib/engagement";
import { normalizeLink } from "@/lib/links";
import type { Deal, DealAudience, DealRequirement } from "@/lib/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
/** Date ISO → valeur d'un champ date (jour local). */
const toDay = (iso: string) => new Date(iso).toLocaleDateString("sv-SE");

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

const actionClass = "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium disabled:opacity-50";
const inputClass = "sw-field mt-1 text-base";

/** Un de mes bons plans : état, audience, modification, retrait et suppression. */
export default function MyDealCard({
  deal,
  audience,
  userId,
  now,
  busy,
  onSave,
  onToggleEnded,
  onDelete,
}: {
  deal: Deal;
  audience: DealAudience | null;
  userId: string;
  now: number;
  busy: boolean;
  onSave: (input: MyDealInput) => Promise<boolean>;
  onToggleEnded: () => void;
  onDelete: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [title, setTitle] = useState(deal.title);
  const [description, setDescription] = useState(deal.description ?? "");
  const [price, setPrice] = useState(deal.price_info ?? "");
  const [lastDay, setLastDay] = useState(deal.expires_at ? toDay(deal.expires_at) : "");
  const [requirements, setRequirements] = useState<DealRequirement[]>(deal.requirements ?? []);
  const [link, setLink] = useState(deal.link_url ?? "");
  const [linkError, setLinkError] = useState<string | null>(null);

  const byMerchant = !!deal.ended_by && deal.ended_by !== userId;
  const expired = !!deal.expires_at && new Date(deal.expires_at).getTime() < now;
  const status = byMerchant
    ? "Retiré par un commerçant"
    : deal.ended_by_merchant
      ? "Plus dispo"
      : expired
        ? "Expiré"
        : "En ligne";

  function startEdit() {
    setTitle(deal.title);
    setDescription(deal.description ?? "");
    setPrice(deal.price_info ?? "");
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
      price_info: price.trim() || null,
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
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
        </label>
        <label className="block text-sm font-medium">
          Détails
          <textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-medium">
            Prix
            <input className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} maxLength={40} />
          </label>
          <label className="block text-sm font-medium">
            Dernier jour
            <input type="date" className={inputClass} value={lastDay} onChange={(e) => setLastDay(e.target.value)} />
          </label>
        </div>
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

  return (
    <article className="sw-card p-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex items-center gap-1.5 font-medium leading-snug">
          <CategoryIcon category={deal.category} size={20} /> {deal.title}
        </h3>
        <span
          className="shrink-0 rounded-full px-2 py-1 text-xs font-medium"
          style={
            status === "En ligne"
              ? { backgroundColor: "var(--color-sage)", color: "var(--color-forest)" }
              : { backgroundColor: "var(--color-border)", color: "var(--color-muted)" }
          }
        >
          {status}
        </span>
      </div>
      <p className="text-sm text-[var(--color-muted)]">
        {[deal.price_info, `publié le ${formatDate(deal.created_at)}`, deal.expires_at && `jusqu'au ${formatDate(deal.expires_at)}`]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {audience && (
        <dl className="mt-2 grid grid-cols-5 gap-1 text-center">
          {(
            [
              [EyeIcon, "Vues", audience.views],
              [WalkIcon, "Passages", audience.visits],
              [HeartIcon, "Favoris", audience.favorites],
              [ThumbsUpIcon, "Confirmé", audience.confirmations],
              [ThumbsDownIcon, "Plus dispo", audience.reports],
            ] as const
          ).map(([Icon, label, value]) => (
            <div key={label} className="rounded-xl py-1.5" style={{ backgroundColor: "var(--color-paper)" }}>
              <dd className="text-base font-bold">{value}</dd>
              <dt className="text-[10px] leading-tight text-[var(--color-muted)]">
                <Icon className="mx-auto h-3.5 w-3.5" />
                {label}
              </dt>
            </div>
          ))}
        </dl>
      )}

      {mode === "delete" ? (
        <div className="mt-3 rounded-xl p-3 text-sm" style={{ backgroundColor: "var(--color-lilac)" }}>
          <p>Supprimer définitivement ce bon plan, avec ses votes et ses favoris ?</p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={busy} onClick={onDelete} className="sw-btn-primary" style={{ backgroundColor: "#b91c1c" }}>Supprimer</button>
            <button type="button" onClick={() => setMode("view")} className="sw-btn-secondary">Annuler</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
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
    </article>
  );
}
