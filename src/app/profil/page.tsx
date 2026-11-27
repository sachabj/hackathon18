"use client";

// Profil étudiant (Justin) : préférences, localisation et compte. Mes bons plans sont dans « Ciblés > Activité ».
// TODO Tâche 11 (Matteo) : bouton « 📍 Simuler ma position ».
import Link from "next/link";
import { useEffect, useState } from "react";
import AccountLink from "@/components/account/AccountLink";
import LocationSetting from "@/components/location/LocationSetting";
import LogoutButton from "@/components/LogoutButton";
import { TargetIcon } from "@/components/icons";
import PreferencesSummary from "@/components/profile/PreferencesSummary";
import { toStudentProfile } from "@/lib/matching";
import { fetchMyPreferences } from "@/lib/preferences";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function Page() {
  const [account, setAccount] = useState<Awaited<ReturnType<typeof fetchMyPreferences>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Relit les préférences (le retrait de la localisation efface la position enregistrée). */
  const [version, setVersion] = useState(0);

  // Relu à chaque retour sur la page (Next conserve l'état).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchMyPreferences()
      .then((a) => {
        if (cancelled) return;
        setAccount(a);
        setError(null);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [version]);

  const profile = account?.profile;

  return (
    <div className="mx-auto w-full max-w-md lg:max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl">{profile?.username ?? "Mon profil"}</h1>
        {error && (
          <p role="alert" className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {!account && !error && <p className="mt-2 text-sm text-[var(--color-muted)]">Chargement…</p>}
      </div>

      {account && (
        <section>
          <h2 className="mb-2 text-lg">Mes préférences</h2>
          {account.profile.onboarded ? (
            <PreferencesSummary me={toStudentProfile(account.profile, account.preferences)} />
          ) : (
            <Link href="/onboarding" className="flex items-center justify-center gap-1.5 rounded-2xl px-4 py-3 font-medium" style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}>
              <TargetIcon className="h-4 w-4" /> Personnaliser mes bons plans
            </Link>
          )}
        </section>
      )}

      {account && <LocationSetting onChange={() => setVersion((v) => v + 1)} />}

      <AccountLink />

      <LogoutButton />
    </div>
  );
}
