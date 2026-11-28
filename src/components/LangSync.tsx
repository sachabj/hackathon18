"use client";

import { useEffect } from "react";
import { useLang } from "@/lib/i18n";

/** Tient `<html lang>` à jour (lecteurs d'écran, correcteur). */
export default function LangSync() {
  const lang = useLang();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
