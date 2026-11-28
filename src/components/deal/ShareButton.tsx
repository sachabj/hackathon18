"use client";

// « Partager » dans la fiche d'un bon plan : le lien porte mon code, pour compter les amis aidés.
import { useEffect, useState } from "react";
import { ShareIcon } from "@/components/icons";
import { dealLink, fetchMyCode } from "@/lib/community";
import { shareOrCopy } from "@/lib/share";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Deal } from "@/lib/types";

export default function ShareButton({ deal }: { deal: Deal }) {
  // Lu à l'ouverture de la fiche : le partage doit partir directement du clic.
  const [code, setCode] = useState<string | null>(null);
  const [status, setStatus] = useState<"copied" | "failed" | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchMyCode().then((c) => !cancelled && setCode(c));
    return () => {
      cancelled = true;
    };
  }, []);

  async function share() {
    const result = await shareOrCopy({ title: deal.title, text: `Bon plan sur ShareWood : ${deal.title}`, url: dealLink(deal.id, code) });
    setStatus(result === "copied" || result === "failed" ? result : null);
  }

  return (
    <div className="min-w-0">
      <button type="button" onClick={share} className="sw-btn-secondary w-full">
        <ShareIcon className="h-4 w-4" /> {status === "copied" ? "Lien copié !" : "Partager"}
      </button>
      {status === "failed" && (
        <p role="alert" className="mt-1 break-all text-xs text-[var(--color-muted)]">
          Copie ce lien : {dealLink(deal.id, code)}
        </p>
      )}
      <span role="status" className="sr-only">{status === "copied" ? "Lien copié" : ""}</span>
    </div>
  );
}
