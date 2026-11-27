import { StoreIcon } from "@/components/icons";
import type { Business } from "@/lib/types";
import BusinessForm from "./BusinessForm";

/** Cadre commun des pages commerçant : titre, chargement, erreur et création du commerce. */
export default function MerchantPage({
  title,
  business,
  error,
  children,
}: {
  title: string;
  /** undefined = en cours de chargement, null = commerce pas encore créé */
  business: Business | null | undefined;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--color-forest)" }}>
        {business ? (
          <>
            <StoreIcon className="h-4 w-4" /> {business.name}
          </>
        ) : (
          "Espace commerçant"
        )}
      </p>
      <h1 className="text-2xl">{business === null ? "Mon commerce" : title}</h1>
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {business === undefined && !error && <p className="mt-4 text-sm text-[var(--color-muted)]">Chargement…</p>}
      {business === null && (
        <div className="mt-4">
          {/* Rechargement complet : tous les écrans doivent voir le nouveau commerce. */}
          <BusinessForm onDone={() => window.location.reload()} />
        </div>
      )}
      {business && children}
    </div>
  );
}
