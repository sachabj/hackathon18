"use client";

import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase/client";

/** Le compte connecté est-il commerçant ? Revérifié quand `key` change (ex. : la page courante). */
export function useIsMerchant(key: string) {
  const [merchant, setMerchant] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    getSupabase()
      .rpc("is_merchant")
      .then(({ data }) => !cancelled && setMerchant(data === true));
    return () => {
      cancelled = true;
    };
  }, [key]);

  return merchant;
}
