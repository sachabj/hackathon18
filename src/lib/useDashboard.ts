"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchDashboard, type Dashboard } from "./merchant";
import { isSupabaseConfigured } from "./supabase/client";

/** Données de l'espace commerçant, relues à chaque retour sur une page. */
export function useDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      setData(await fetchDashboard());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchDashboard()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  /** Exécute une action puis relit les données. */
  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return { data, error, busy, act, reload };
}
