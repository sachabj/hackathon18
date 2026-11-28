"use client";

// Onglet « Activité » : niveau (une ligne), mes bons plans avec leurs Flèches, puis le reste de l'historique.
import { useCallback, useEffect, useState } from "react";
import ArrowHistory from "@/components/cibles/ArrowHistory";
import MyDeals, { type Mine } from "@/components/cibles/MyDeals";
import ActivityCard from "@/components/cibles/ActivityCard";
import type { DealGains } from "@/components/cibles/MyDealCard";
import { fetchArrowLog, onArrows, type ArrowLine } from "@/lib/arrows";
import { fetchMyDeals } from "@/lib/engagement";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { UserContribution } from "@/lib/types";
import { useMyArrows } from "@/lib/useMyArrows";
import { tr } from "@/lib/i18n";

async function fetchContributions() {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error(tr("Session expirée : reconnecte-toi."));
  const { data, error } = await supabase.from("user_contributions").select("*").eq("user_id", user.id);
  if (error) throw new Error(error.message);
  return data as UserContribution[];
}

export default function ActivityPanel() {
  const arrows = useMyArrows();
  const [contributions, setContributions] = useState<UserContribution[] | null>(null);
  const [mine, setMine] = useState<Mine | null>(null);
  /** null : chargement, ou pas encore de Flèches (migration 016) */
  const [log, setLog] = useState<ArrowLine[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback((isCancelled: () => boolean = () => false) => {
    const fail = (e: Error) => !isCancelled() && setError(e.message);
    // Chargements séparés : un souci sur l'un n'empêche pas d'afficher les autres.
    return Promise.all([
      fetchContributions().then((c) => !isCancelled() && setContributions(c)).catch(fail),
      fetchMyDeals().then((d) => !isCancelled() && setMine(d)).catch(fail),
      fetchArrowLog().then((l) => !isCancelled() && setLog(l)).catch(fail),
    ]);
  }, []);

  // Relu à chaque retour sur la page, et quand les Flèches changent.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    load(() => cancelled);
    const stop = onArrows(() => load(() => cancelled));
    return () => {
      cancelled = true;
      stop();
    };
  }, [load]);

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  // Les gains de publication et de bonus s'affichent sur le bon plan ; l'historique ne les répète pas.
  const ownIds = new Set(mine?.deals.map((d) => d.id));
  const onDeal = (l: ArrowLine) => (l.kind === "create" || l.kind === "bonus") && !!l.deal_id && ownIds.has(l.deal_id);
  const gains = new Map<string, DealGains>();
  for (const l of log ?? []) {
    if (onDeal(l)) gains.set(l.deal_id!, { ...gains.get(l.deal_id!), [l.kind as "create" | "bonus"]: l.amount });
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {(!contributions || !mine) && !error && <p className="text-sm text-[var(--color-muted)]">{tr("Chargement…")}</p>}
      {contributions && <ActivityCard contributions={contributions} />}
      {mine && <MyDeals mine={mine} gains={gains} busy={busy} act={act} />}
      {mine && log && <ArrowHistory lines={log.filter((l) => !onDeal(l))} todayVotes={arrows?.today_votes ?? null} />}
    </div>
  );
}
