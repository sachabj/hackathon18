"use client";

import { useEffect, useState } from "react";
import { fetchMyArrows, onArrows, type MyArrows } from "./arrows";
import { isSupabaseConfigured } from "./supabase/client";

/** Ses Flèches, relues à chaque retour sur la page et après chaque action qui les change. */
export function useMyArrows() {
  const [data, setData] = useState<MyArrows | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    const load = () => fetchMyArrows().then((d) => !cancelled && setData(d));
    load();
    const stop = onArrows(load);
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  return data;
}
