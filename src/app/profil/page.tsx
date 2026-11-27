"use client";

// Profil étudiant (Justin) : préférences, mes bons plans et leur audience.
// TODO Tâche 11 (Matteo) : bouton « 📍 Simuler ma position ».
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AccountLink from "@/components/account/AccountLink";
import UseArrowsLink from "@/components/arrows/UseArrowsLink";
import LogoutButton from "@/components/LogoutButton";
import { TargetIcon } from "@/components/icons";
import MyDealCard from "@/components/profile/MyDealCard";
import PreferencesSummary from "@/components/profile/PreferencesSummary";
import { deleteMyDeal, fetchMyDeals, setMyDealEnded, updateMyDeal } from "@/lib/engagement";
import { toStudentProfile } from "@/lib/matching";
import { fetchMyPreferences } from "@/lib/preferences";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function Page() {
  const [account, setAccount] = useState<Awaited<ReturnType<typeof fetchMyPreferences>> | null>(null);
  const [mine, setMine] = useState<Awaited<ReturnType<typeof fetchMyDeals>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    (isCancelled: () => boolean = () => false) => {
      const fail = (e: Error) => !isCancelled() && setError(e.message);
      // Deux chargements séparés : un souci sur l'un n'empêche pas d'afficher l'autre.
      return Promise.all([
        fetchMyPreferences().then((a) => !isCancelled() && setAccount(a)).catch(fail),
        fetchMyDeals().then((d) => !isCancelled() && setMine(d)).catch(fail),
      ]);
    },
    [],
  );

  // Relu à chaque retour sur la page (Next conserve l'état).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const profile = account?.profile;
  const total = (key: "views" | "visits") =>
    Object.values(mine?.stats ?? {}).reduce((sum, a) => sum + a[key], 0);

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl">{profile?.username ?? "Mon profil"}</h1>
        {error && (
          <p role="alert" className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {!account && !error && <p className="mt-2 text-sm text-[var(--color-muted)]">Chargement…</p>}
      </div>

      {/* Flèches, influence et activité sont sur la page « Ciblés ». */}
      {account && <UseArrowsLink />}

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

      {mine && (
        <section>
          <h2 className="text-lg">Mes bons plans signalés ({mine.deals.length})</h2>
          {mine.stats && mine.deals.length > 0 && (
            <p className="text-sm text-[var(--color-muted)]">
              Au total : {total("views")} vue{total("views") > 1 ? "s" : ""} et {total("visits")} passage
              {total("visits") > 1 ? "s" : ""}.
            </p>
          )}
          {mine.statsError && <p className="mt-1 text-sm text-amber-700">Chiffres indisponibles. {mine.statsError}</p>}
          {mine.deals.length === 0 && (
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Tu n&apos;as encore rien signalé.{" "}
              <Link href="/publier" className="font-medium" style={{ color: "var(--color-forest)" }}>Partager un bon plan</Link>
            </p>
          )}
          <ul className="mt-3 space-y-3">
            {mine.deals.map((deal) => (
              <li key={deal.id}>
                <MyDealCard
                  deal={deal}
                  audience={mine.stats?.[deal.id] ?? null}
                  userId={mine.userId}
                  now={mine.fetchedAt}
                  busy={busy}
                  onSave={(input) => act(() => updateMyDeal(deal.id, input))}
                  onToggleEnded={() => act(() => setMyDealEnded(deal.id, !deal.ended_by_merchant))}
                  onDelete={() => act(() => deleteMyDeal(deal.id))}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <AccountLink />

      <LogoutButton />
    </div>
  );
}
