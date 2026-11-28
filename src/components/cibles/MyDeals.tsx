"use client";

// « Mes bons plans » (déplacés du profil de Justin) : lignes dépliables avec leurs Flèches.
import Link from "next/link";
import MyDealCard, { type DealGains } from "@/components/cibles/MyDealCard";
import { deleteMyDeal, fetchMyDeals, setMyDealEnded, updateMyDeal } from "@/lib/engagement";
import { useT } from "@/lib/i18n";

export type Mine = Awaited<ReturnType<typeof fetchMyDeals>>;

export default function MyDeals({
  mine,
  gains,
  busy,
  act,
}: {
  mine: Mine;
  gains: Map<string, DealGains>;
  busy: boolean;
  /** Exécute une modification puis relit la liste ; false en cas d'échec. */
  act: (action: () => Promise<void>) => Promise<boolean>;
}) {
  const t = useT();
  return (
    <section aria-label={t("Mes bons plans")}>
      <h2 className="text-lg">{t("Mes bons plans signalés ({n})", { n: mine.deals.length })}</h2>
      {mine.statsError && <p className="mt-1 text-sm text-amber-700">{t("Chiffres indisponibles.")} {mine.statsError}</p>}
      {mine.deals.length === 0 && (
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t("Tu n'as encore rien signalé.")}{" "}
          <Link href="/publier" className="font-medium" style={{ color: "var(--color-forest)" }}>{t("Partager un bon plan")}</Link>
        </p>
      )}
      <ul className="mt-2 space-y-2">
        {mine.deals.map((deal) => (
          <li key={deal.id}>
            <MyDealCard
              deal={deal}
              audience={mine.stats?.[deal.id] ?? null}
              gains={gains.get(deal.id)}
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
  );
}
