"use client";

import Link from "next/link";
import { LockClosedIcon } from "@/components/icons";
import { useT } from "@/lib/i18n";

/** Mention « position sécurisée », affichée là où la position est partagée. Ne rien y promettre que le code ne fait pas. */
export default function LocationNotice({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const t = useT();
  return (
    <p className={`flex items-start gap-1.5 text-xs text-[var(--color-muted)] ${className}`}>
      <LockClosedIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-forest)]" />
      <span>
        <strong style={{ color: "var(--color-forest)" }}>{t("Position sécurisée.")}</strong> {children}{" "}
        <Link href="/confidentialite#localisation" target="_blank" className="underline">
          {t("En savoir plus")}
        </Link>
      </span>
    </p>
  );
}
