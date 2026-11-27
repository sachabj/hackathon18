"use client";

// Espace commerçant — compte (Justin)
import AccountLink from "@/components/account/AccountLink";
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
          <dl className="sw-card mt-4 divide-y divide-[var(--color-border)]">
            {[
              ["Commerce", business.name],
              ["Activité", CATEGORIES[business.category].label],
              ["Adresse", business.address ?? "Non renseignée"],
              ["Zone", ZONES.find((z) => z.id === business.zone_id)?.name ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3 p-3 text-sm">
                <dt className="w-24 shrink-0 text-[var(--color-muted)]">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </MerchantPage>
      {/* Toujours accessible, même sans commerce ou en cas d'erreur. */}
      <div className="mx-auto w-full max-w-md space-y-3 px-4 pb-6">
        <AccountLink />
        <LogoutButton />
      </div>
    </>
  );
}
