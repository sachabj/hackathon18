"use client";

// Espace commerçant (tâche 13) — Justin
import { useCallback, useEffect, useState } from "react";
import BusinessForm from "@/components/merchant/BusinessForm";
import OfferCard from "@/components/merchant/OfferCard";
import OfferForm from "@/components/merchant/OfferForm";
import { buttonClass } from "@/components/merchant/styles";
import { CATEGORIES } from "@/lib/constants";
import {
  boostOffer,
  fetchDashboard,
  publishOffer,
  setNearbyDealEnded,
  setOfferEnded,
  updateOffer,
  type Dashboard,
} from "@/lib/merchant";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function Page() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** "new" = formulaire de création ouvert ; sinon id de l'offre en cours de modification. */
  const [editing, setEditing] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(await fetchDashboard());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchDashboard()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  const business = data?.business;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <p className="text-sm font-bold text-blue-600">Espace commerçant</p>
      <h1 className="text-2xl font-bold">{business ? business.name : "Mon commerce"}</h1>
      {business && (
        <p className="text-sm text-zinc-500">
          {CATEGORIES[business.category].emoji} {CATEGORIES[business.category].label}
          {business.address && ` · ${business.address}`}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {!data && !error && <p className="mt-4 text-sm text-zinc-500">Chargement…</p>}

      {data && !business && (
        <div className="mt-4">
          {/* Rechargement complet : la barre du bas doit afficher l'onglet « Commerce ». */}
          <BusinessForm onDone={() => window.location.reload()} />
        </div>
      )}

      {data && business && (
        <>
          <div className="mt-4">
            {editing === "new" ? (
              <OfferForm
                defaultCategory={business.category}
                onCancel={() => setEditing(null)}
                onSubmit={async (input) => {
                  await publishOffer(business, input);
                  setEditing(null);
                  await reload();
                }}
              />
            ) : (
              <button type="button" onClick={() => setEditing("new")} className={buttonClass}>
                ➕ Publier une offre officielle
              </button>
            )}
          </div>

          <section className="mt-6">
            <h2 className="text-lg font-semibold">Mes offres ({data.offers.length})</h2>
            {data.offers.length === 0 && <p className="mt-1 text-sm text-zinc-500">Aucune offre pour le moment.</p>}
            <ul className="mt-3 space-y-3">
              {data.offers.map((offer) => (
                <li key={offer.id}>
                  {editing === offer.id ? (
                    <OfferForm
                      offer={offer}
                      defaultCategory={business.category}
                      onCancel={() => setEditing(null)}
                      onSubmit={async (input) => {
                        await updateOffer(offer.id, input);
                        setEditing(null);
                        await reload();
                      }}
                    />
                  ) : (
                    <OfferCard
                      offer={offer}
                      stats={data.stats[offer.id]}
                      busy={busy}
                      onEdit={() => setEditing(offer.id)}
                      onToggleEnded={() => act(() => setOfferEnded(offer.id, !offer.ended_by_merchant))}
                      onBoost={() => act(() => boostOffer(offer.id))}
                    />
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-semibold">Signalés près de chez moi</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Bons plans publiés par des étudiants à moins de 75 m, dans ma catégorie. Retire ceux qui n&apos;existent plus.
            </p>
            {data.nearby.length === 0 && <p className="mt-2 text-sm text-zinc-500">Aucun signalement.</p>}
            <ul className="mt-3 space-y-3">
              {data.nearby.map((deal) => (
                <li key={deal.id} className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                  <h3 className={`font-semibold ${deal.ended_by_merchant ? "text-zinc-400 line-through" : ""}`}>{deal.title}</h3>
                  <p className="text-sm text-zinc-500">{[deal.price_info, deal.place_name].filter(Boolean).join(" · ")}</p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(() => setNearbyDealEnded(deal.id, !deal.ended_by_merchant))}
                    className={`mt-2 rounded-full border px-3 py-1.5 text-sm font-semibold disabled:opacity-50 ${deal.ended_by_merchant ? "border-green-300 text-green-700" : "border-red-300 text-red-600"}`}
                  >
                    {deal.ended_by_merchant ? "↩️ Annuler le retrait" : "🚫 N'existe plus"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
