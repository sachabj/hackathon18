"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import type { MyDealInput } from "@/lib/engagement";
import type { Deal, DealAudience } from "@/lib/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
/** Date ISO → valeur d'un champ date (jour local). */
const toDay = (iso: string) => new Date(iso).toLocaleDateString("sv-SE");

const actionClass = "rounded-full border px-3 py-1.5 text-sm font-semibold disabled:opacity-50";
const inputClass = "mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base font-normal";

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
    setMode("edit");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
    });
    if (saved) setMode("view");
  }

  if (mode === "edit") {
    return (
      <form onSubmit={submit} className="space-y-3 rounded-2xl border-2 border-blue-200 bg-blue-50/40 p-3">
        <label className="block text-sm font-semibold">
          Titre
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
        </label>
        <label className="block text-sm font-semibold">
          Détails
          <textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-semibold">
            Prix
            <input className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} maxLength={40} />
          </label>
          <label className="block text-sm font-semibold">
            Dernier jour
            <input type="date" className={inputClass} value={lastDay} onChange={(e) => setLastDay(e.target.value)} />
          </label>
        </div>
        <div className="flex gap-2">
          <button disabled={busy} className={`${actionClass} border-blue-600 bg-blue-600 text-white`}>Enregistrer</button>
          <button type="button" onClick={() => setMode("view")} className={`${actionClass} border-zinc-300`}>Annuler</button>
        </div>
      </form>
    );
  }

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug">
          {CATEGORIES[deal.category].emoji} {deal.title}
        </h3>
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${status === "En ligne" ? "bg-green-100 text-green-800" : "bg-zinc-200 text-zinc-600"}`}>
          {status}
        </span>
      </div>
      <p className="text-sm text-zinc-500">
        {[deal.price_info, `publié le ${formatDate(deal.created_at)}`, deal.expires_at && `jusqu'au ${formatDate(deal.expires_at)}`]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {audience && (
        <dl className="mt-2 grid grid-cols-5 gap-1 text-center">
          {[
            ["👁️", "Vues", audience.views],
            ["🚶", "Passages", audience.visits],
            ["❤️", "Favoris", audience.favorites],
            ["👍", "Dispo", audience.confirmations],
            ["👎", "Plus dispo", audience.reports],
          ].map(([emoji, label, value]) => (
            <div key={label} className="rounded-xl bg-zinc-100 py-1.5">
              <dd className="text-base font-bold">{value}</dd>
              <dt className="text-[10px] leading-tight text-zinc-500">
                <span aria-hidden className="block">{emoji}</span>
                {label}
              </dt>
            </div>
          ))}
        </dl>
      )}

      {mode === "delete" ? (
        <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm">
          <p>Supprimer définitivement ce bon plan, avec ses votes et ses favoris ?</p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={busy} onClick={onDelete} className={`${actionClass} border-red-600 bg-red-600 text-white`}>Supprimer</button>
            <button type="button" onClick={() => setMode("view")} className={`${actionClass} border-zinc-300`}>Annuler</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={startEdit} className={`${actionClass} border-zinc-300`}>✏️ Modifier</button>
          {!byMerchant && (
            <button type="button" disabled={busy} onClick={onToggleEnded} className={`${actionClass} border-zinc-300`}>
              {deal.ended_by_merchant ? "↩️ Remettre en ligne" : "🚫 Plus dispo"}
            </button>
          )}
          <button type="button" disabled={busy} onClick={() => setMode("delete")} className={`${actionClass} border-red-300 text-red-600`}>
            🗑️ Supprimer
          </button>
        </div>
      )}
    </article>
  );
}
