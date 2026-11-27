"use client";

// Espace commerçant (tâche 13) — Justin · liste des offres
import { useState } from "react";
import MerchantPage from "@/components/merchant/MerchantPage";
import OfferCard from "@/components/merchant/OfferCard";
import OfferForm from "@/components/merchant/OfferForm";
import { buttonClass } from "@/components/merchant/styles";
import { boostOffer, publishOffer, setNearbyDealEnded, setOfferEnded, updateOffer } from "@/lib/merchant";
import { useDashboard } from "@/lib/useDashboard";

export default function Page() {
  const { data, error, busy, act, reload } = useDashboard();
  /** "new" = formulaire de création ouvert ; sinon id de l'offre en cours de modification. */
  const [editing, setEditing] = useState<string | null>(null);
  const business = data?.business;

  return (
    <MerchantPage title="Mes offres" business={data ? data.business : undefined} error={error}>
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

          {data.offers.length === 0 && <p className="mt-4 text-sm text-zinc-500">Aucune offre pour le moment.</p>}
          <ul className="mt-4 space-y-3">
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

          <section className="mt-8">
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
    </MerchantPage>
  );
}
