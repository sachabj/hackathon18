"use client";

// Espace commerçant — compte (Justin)
import LogoutButton from "@/components/LogoutButton";
import MerchantPage from "@/components/merchant/MerchantPage";
import { CATEGORIES, ZONES } from "@/lib/constants";
import { useDashboard } from "@/lib/useDashboard";

export default function Page() {
  const { data, error } = useDashboard();
  const business = data?.business;

  return (
    <>
      <MerchantPage title="Mon compte" business={data ? data.business : undefined} error={error}>
        {business && (
          <dl className="mt-4 divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
            {[
              ["Commerce", business.name],
              ["Activité", `${CATEGORIES[business.category].emoji} ${CATEGORIES[business.category].label}`],
              ["Adresse", business.address ?? "Non renseignée"],
              ["Zone", ZONES.find((z) => z.id === business.zone_id)?.name ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3 p-3 text-sm">
                <dt className="w-24 shrink-0 text-zinc-500">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </MerchantPage>
      {/* Toujours accessible, même sans commerce ou en cas d'erreur. */}
      <div className="mx-auto w-full max-w-md px-4 pb-6">
        <LogoutButton />
      </div>
    </>
  );
}
