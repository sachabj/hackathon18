"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

/** Accès à la page « Compte et confidentialité » depuis les profils étudiant et commerçant. */
export default function AccountLink() {
  const t = useT();
  return (
    <Link href="/compte" className="sw-card flex items-center gap-3 p-3">
      <span className="flex-1">
        <span className="block font-medium">{t("Compte et confidentialité")}</span>
        <span className="block text-sm text-[var(--color-muted)]">{t("Mot de passe, appareils, mes données, suppression")}</span>
      </span>
      <span aria-hidden className="text-[var(--color-muted)]">›</span>
    </Link>
  );
}
