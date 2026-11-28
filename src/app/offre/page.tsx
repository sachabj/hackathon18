"use client";

// Un bon plan ouvert depuis un lien partagé : `/offre?id=<offre>&de=<code de la personne qui partage>`.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import DealSheet from "@/components/deal/DealSheet";
import { recordShareOpen } from "@/lib/community";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Deal } from "@/lib/types";
import { useT } from "@/lib/i18n";

export default function Page() {
  const router = useRouter();
  const t = useT();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [missing, setMissing] = useState(false);

  // La page quittée est conservée par Next : la fiche est refermée en partant, l'adresse relue au retour.
  useLayoutEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const code = params.get("de");
    const load = async () => {
      const { data } = id ? await getSupabase().from("deals").select("*").eq("id", id).maybeSingle() : { data: null };
      if (cancelled) return;
      setMissing(!data);
      setDeal(data as Deal | null);
      if (data && code) recordShareOpen(data.id as string, code);
    };
    load();
    return () => {
      cancelled = true;
      setDeal(null);
      setMissing(false);
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-10 text-center">
      <h1 className="text-2xl">{missing ? t("Bon plan introuvable") : t("Bon plan partagé")}</h1>
      <p className="text-sm text-[var(--color-muted)]">
        {missing ? t("Il a peut-être été supprimé depuis le partage.") : deal ? deal.title : t("Chargement…")}
      </p>
      <Link href="/" className="sw-btn-primary">
        {t("Voir tous les bons plans")}
      </Link>
      {deal && <DealSheet deal={deal} onClose={() => router.push("/")} />}
    </div>
  );
}
