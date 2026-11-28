// Réunit en un seul fichier les quatre scripts qui remettent la démo à zéro :
//   node scripts/build_demo_sql.mjs   →   supabase/demo_complet.local.sql (jamais sur git)
// Les comptes à garder et le mot de passe de démo sont repris de supabase/reset_demo.local.sql.
import { readFileSync, writeFileSync } from "node:fs";

const dir = new URL("../supabase/", import.meta.url);
const read = (name) => readFileSync(new URL(name, dir), "utf8");
const KEEP = /keep text\[\] := array\[[\s\S]*?\];/;
const PASSWORD = /demo_password text := '(?:[^']|'')*';/;

let local;
try {
  local = read("reset_demo.local.sql");
} catch {
  console.error(
    "Il manque supabase/reset_demo.local.sql : copier reset_demo.sql sous ce nom, puis remplir en haut les comptes à garder et le mot de passe.",
  );
  process.exit(1);
}

// Dernière version du script, avec seulement les deux réglages personnels de la copie locale.
let reset = read("reset_demo.sql");
for (const block of [KEEP, PASSWORD]) {
  const mine = local.match(block)?.[0];
  if (!mine || !block.test(reset)) throw new Error(`Bloc introuvable : ${block}`);
  if (/EMAIL_A_GARDER|CHOISIR_UN_MOT_DE_PASSE/.test(mine)) {
    console.error("Remplir les comptes à garder et le mot de passe dans supabase/reset_demo.local.sql.");
    process.exit(1);
  }
  reset = reset.replace(block, () => mine);
}

const parts = [
  ["reset_demo.sql", reset],
  ...["import_sources.sql", "import_burgerking.sql", "seed_arrows.sql"].map((name) => [name, read(name)]),
];

// Le SQL Editor n'affiche que le dernier résultat : ce bilan reprend l'essentiel.
const summary = `select r.compte_a_garder, r.etat,
  (select count(*) from auth.users) as comptes,
  (select count(*) from public.deals) as bons_plans,
  (select count(*) from public.deals where source_name is not null) as sources_officielles,
  (select count(*) from public.arrow_events) as gains_de_fleches
from reset_report r order by r.compte_a_garder;`;

writeFileSync(
  new URL("demo_complet.local.sql", dir),
  [
    "-- Généré par scripts/build_demo_sql.mjs : NE PAS committer (mot de passe), NE PAS modifier à la main.",
    "-- ⚠️ SUPPRIME les comptes non listés. À coller dans Supabase → SQL Editor → Run.",
    ...parts.map(([name, sql]) => `\n-- >>>>>>>>>> ${name}\n${sql}`),
    `\n-- >>>>>>>>>> Bilan\n${summary}\n`,
  ].join("\n"),
);
console.log("supabase/demo_complet.local.sql prêt (jour de la démo : les séries partent de la date d'exécution).");
