"use client";

// Compte et confidentialité, pour les étudiants comme pour les commerçants. Responsable : Sacha.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DataSection from "@/components/account/DataSection";
import DeleteSection from "@/components/account/DeleteSection";
import SecuritySection from "@/components/account/SecuritySection";
import { ArrowLeftIcon } from "@/components/icons";
import { fetchAccountInfo } from "@/lib/account";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function Page() {
  const router = useRouter();
  const [info, setInfo] = useState<Awaited<ReturnType<typeof fetchAccountInfo>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Next conserve la page quittée : à chaque retour, on relit tout et on vide les champs saisis.
  const [visit, setVisit] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchAccountInfo()
      .then((result) => {
        if (cancelled) return;
        setInfo(result);
        setError(null);
        setVisit((v) => v + 1);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
      setInfo(null);
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <button type="button" onClick={() => router.back()} className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--color-forest)" }}>
        <ArrowLeftIcon className="h-4 w-4" /> Retour
      </button>
      <div>
        <h1 className="text-2xl">Compte et confidentialité</h1>
        <p className="text-sm text-[var(--color-muted)]">{info?.email}</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {!info && !error && <p className="text-sm text-[var(--color-muted)]">Chargement…</p>}
      {info && (
        <div key={visit} className="space-y-4">
          <SecuritySection email={info.email} />
          <DataSection {...info} />
          <DeleteSection />
        </div>
      )}
    </div>
  );
}
