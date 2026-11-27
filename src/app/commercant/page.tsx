"use client";

// Espace commerçant (tâche 13) — Justin · liste des offres
import { useState } from "react";
import MerchantPage from "@/components/merchant/MerchantPage";
import OfferCard from "@/components/merchant/OfferCard";
import OfferForm from "@/components/merchant/OfferForm";
import { buttonClass } from "@/components/merchant/styles";
import { PlusIcon, ProhibitedIcon, UndoIcon } from "@/components/icons";
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
          <div className="mt-4 lg:max-w-2xl">
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
              <button type="button" onClick={() => setEditing("new")} className={`${buttonClass} flex items-center justify-center gap-1.5`}>
                <PlusIcon className="h-4 w-4" /> Publier une offre officielle
              </button>
            )}
          </div>

          {data.offers.length === 0 && <p className="mt-4 text-sm text-[var(--color-muted)]">Aucune offre pour le moment.</p>}
          <ul className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
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
            <h2 className="text-lg">Signalés près de chez moi</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Bons plans publiés par des étudiants à moins de 75 m, dans ma catégorie. Retire ceux qui n&apos;existent plus.
            </p>
            {data.nearby.length === 0 && <p className="mt-2 text-sm text-[var(--color-muted)]">Aucun signalement.</p>}
            <ul className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {data.nearby.map((deal) => (
                <li key={deal.id} className="sw-card p-3">
                  <h3 className={`font-medium ${deal.ended_by_merchant ? "text-[var(--color-muted)] line-through" : ""}`}>{deal.title}</h3>
                  <p className="text-sm text-[var(--color-muted)]">{deal.place_name}</p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(() => setNearbyDealEnded(deal.id, !deal.ended_by_merchant))}
                    className="mt-2 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                    style={deal.ended_by_merchant ? { borderColor: "var(--color-forest)", color: "var(--color-forest)" } : { borderColor: "#fca5a5", color: "#dc2626" }}
                  >
                    {deal.ended_by_merchant ? (
                      <>
                        <UndoIcon className="h-4 w-4" /> Annuler le retrait
                      </>
                    ) : (
                      <>
                        <ProhibitedIcon className="h-4 w-4" /> N&apos;existe plus
                      </>
                    )}
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
