"use client";

// Classement des écoles (tâche 70), page « Ciblés » : podium, son école et son rang.
import Link from "next/link";
import { useEffect, useState } from "react";
import { GraduationCapIcon } from "@/components/icons";
import { onArrows } from "@/lib/arrows";
import { useT } from "@/lib/i18n";
import { fetchSchoolRanking, SCHOOL_MIN_MEMBERS, type SchoolRank, type SchoolRanking as Ranking } from "@/lib/schools";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const MEDALS = ["#d4a017", "#9aa0a6", "#b87333"];

export default function SchoolRanking() {
  const t = useT();
  const [data, setData] = useState<Ranking | null>(null);

  // Relu à chaque retour sur la page et après chaque gain de Flèches.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    const load = () => fetchSchoolRanking().then((d) => !cancelled && setData(d));
    load();
    const stop = onArrows(load);
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  // Sans la migration 028 : rien à montrer.
  if (!data) return null;
  const mine = data.ranking.find((r) => r.id === data.my_school) ?? null;
  const top = data.ranking.slice(0, 3);

  const row = (r: SchoolRank) => (
    <li
      key={r.id}
      className="flex items-center gap-3 rounded-xl px-3 py-2"
      style={r.id === data.my_school ? { backgroundColor: "var(--color-sage)" } : { backgroundColor: "var(--color-paper)" }}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums"
        style={r.rank <= 3 ? { backgroundColor: MEDALS[r.rank - 1], color: "#1A1A18" } : { backgroundColor: "var(--color-surface)" }}
      >
        {r.rank}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{r.name}</span>
        <span className="block text-xs text-[var(--color-muted)]">
          {t("{n} membres actifs sur {m}", { n: r.active, m: r.members })}
        </span>
      </span>
      <span className="shrink-0 text-right text-sm font-medium tabular-nums" style={{ color: "var(--color-forest)" }}>
        {r.score}
        <span className="block text-[11px] font-normal text-[var(--color-muted)]">{t("Flèches / membre")}</span>
      </span>
    </li>
  );

  return (
    <section className="sw-card space-y-3 p-4" aria-label={t("Classement des écoles")}>
      <div className="flex items-center gap-2">
        <GraduationCapIcon className="h-5 w-5 text-[var(--color-forest)]" />
        <h2 className="text-base">{t("Classement des écoles")}</h2>
      </div>
      <p className="text-xs text-[var(--color-muted)]">
        {t("Flèches gagnées ces 7 derniers jours, par membre actif. Une école est classée à partir de {n} membres.", { n: SCHOOL_MIN_MEMBERS })}
      </p>
      {top.length > 0 ? (
        <ol className="space-y-1.5">
          {top.map(row)}
          {mine && mine.rank > 3 && row(mine)}
        </ol>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">{t("Pas encore assez de membres pour un classement.")}</p>
      )}
      {data.my_school && !mine && (
        <p className="text-sm text-[var(--color-muted)]">
          {t("Ton école sera classée à partir de {n} membres (aujourd'hui {m}) : invite tes amis !", { n: SCHOOL_MIN_MEMBERS, m: data.my_members })}
        </p>
      )}
      {/* Toujours proposé : pour choisir son école, ou en changer. */}
      <Link href="/profil?section=infos" className="block text-sm font-medium underline" style={{ color: "var(--color-forest)" }}>
        {t("Choisis ton lieu d'études")}
      </Link>
    </section>
  );
}
