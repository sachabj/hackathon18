"use client";

// Fiche d'un bon plan : détail, fiabilité, votes et « J'y suis allé » (Justin).
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CategoryIcon from "@/components/CategoryIcon";
import ChainBadge from "@/components/ChainBadge";
import { CalendarIcon, CheckBadgeIcon, CheckIcon, CloseIcon, PinIcon, ThumbsDownIcon, ThumbsUpIcon, WalkIcon } from "@/components/icons";
import { isMajorChain } from "@/lib/chains";
import { CATEGORIES, ZONES } from "@/lib/constants";
import { fetchEngagement, recordView, setVisited, vote, type Engagement } from "@/lib/engagement";
import { reliability } from "@/lib/rules";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Deal } from "@/lib/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

function ago(ms: number) {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `il y a ${hours} h` : `il y a ${Math.round(hours / 24)} j`;
}

export default function DealSheet({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const [data, setData] = useState<(Engagement & { at: number }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const category = CATEGORIES[deal.category];
  const where =
    deal.place_name ??
    (deal.scope === "national" ? "Partout en France" : ZONES.find((z) => z.id === deal.zone_id)?.name);

  useEffect(() => {
    recordView(deal);
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchEngagement(deal.id)
      .then((e) => !cancelled && setData({ ...e, at: Date.now() }))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [deal]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setData({ ...(await fetchEngagement(deal.id)), at: Date.now() });
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  const own = data?.userId === deal.author_id;
  const trust = data ? reliability(data.votes, data.at) : null;
  const myVote = data?.votes.find((v) => v.user_id === data.userId)?.value;
  const voteClass = (on: boolean, color: string) =>
    `flex items-center justify-center gap-1.5 rounded-2xl border-2 py-2.5 text-sm font-medium disabled:opacity-50 ${on ? color : ""}`;

  // Dans <body> : la fiche doit passer au-dessus de la carte, de l'en-tête et de la barre du bas.
  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={deal.title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-4 pb-6"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)]">
            <CategoryIcon category={deal.category} size={22} /> {category.label}
            {deal.is_official && (
              <span className="flex items-center gap-1" style={{ color: "var(--color-forest)" }}>
                {" "}
                · <CheckBadgeIcon className="h-4 w-4" /> Offre officielle
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mt-1 flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--color-paper)" }}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        {isMajorChain(deal) && <ChainBadge className="mb-2" />}
        <h2 className="text-xl leading-snug">{deal.title}</h2>
        {deal.price_info && <p className="text-lg font-medium" style={{ color: "var(--color-forest)" }}>{deal.price_info}</p>}
        {deal.description && <p className="mt-2 text-sm text-[var(--color-ink)]">{deal.description}</p>}
        <p className="mt-2 flex flex-wrap gap-x-3 text-sm text-[var(--color-muted)]">
          {where && (
            <span className="flex items-center gap-1">
              <PinIcon className="h-3.5 w-3.5" /> {where}
            </span>
          )}
          {deal.deadline_at && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5" /> Date limite : {formatDate(deal.deadline_at)}
            </span>
          )}
          {deal.expires_at && <span>Jusqu&apos;au {formatDate(deal.expires_at)}</span>}
        </p>

        {trust && data && (
          <div className="mt-4 rounded-2xl p-3" style={{ backgroundColor: "var(--color-paper)" }}>
            <p className="text-sm font-medium">
              {trust.score === null ? "Pas encore de vote" : `${Math.round(trust.score * 100)} % fiable`}
              {trust.lastConfirmedAt !== null &&
                ` · confirmé ${ago(data.at - trust.lastConfirmedAt)} par ${trust.confirmations} étudiant${trust.confirmations > 1 ? "s" : ""}`}
            </p>
            {data.visit && (
              <p className="text-xs text-[var(--color-muted)]">
                {data.visit.count} étudiant{data.visit.count > 1 ? "s y sont allés" : " y est allé"}
              </p>
            )}
          </div>
        )}

        {data && own && <p className="mt-3 text-sm text-[var(--color-muted)]">C&apos;est ton bon plan : tu suis ses réactions dans ton profil.</p>}
        {data && !own && (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                aria-pressed={myVote === 1}
                onClick={() => act(() => vote(deal.id, 1))}
                className={voteClass(myVote === 1, "")}
                style={{ borderColor: myVote === 1 ? "var(--color-forest)" : "var(--color-border)", backgroundColor: myVote === 1 ? "var(--color-sage)" : undefined, color: myVote === 1 ? "var(--color-forest)" : "var(--color-ink)" }}
              >
                <ThumbsUpIcon className="h-4 w-4" /> Toujours dispo
              </button>
              <button
                type="button"
                disabled={busy}
                aria-pressed={myVote === -1}
                onClick={() => act(() => vote(deal.id, -1))}
                className={voteClass(myVote === -1, "")}
                style={{ borderColor: myVote === -1 ? "var(--color-aubergine)" : "var(--color-border)", backgroundColor: myVote === -1 ? "var(--color-lilac)" : undefined, color: myVote === -1 ? "var(--color-aubergine)" : "var(--color-ink)" }}
              >
                <ThumbsDownIcon className="h-4 w-4" /> Plus dispo
              </button>
            </div>
            {data.visit && (
              <button
                type="button"
                disabled={busy}
                aria-pressed={data.visit.mine}
                onClick={() => act(() => setVisited(deal.id, data.userId, !data.visit!.mine))}
                className={`mt-2 w-full ${voteClass(data.visit.mine, "")}`}
                style={{ borderColor: data.visit.mine ? "var(--color-forest)" : "var(--color-border)", backgroundColor: data.visit.mine ? "var(--color-sage)" : undefined, color: data.visit.mine ? "var(--color-forest)" : "var(--color-ink)" }}
              >
                {data.visit.mine ? <CheckIcon className="h-4 w-4" /> : <WalkIcon className="h-4 w-4" />} J&apos;y suis allé
              </button>
            )}
          </>
        )}
        {!data && !error && <p className="mt-4 text-sm text-[var(--color-muted)]">Chargement…</p>}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
