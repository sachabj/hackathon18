// ShareWood — import de vraies informations (tâche 65). Lit des sources publiques et écrit un script SQL à
// relire puis à coller dans Supabase → SQL Editor. Aucune clé, aucun accès à la base.
//
//   node scripts/import_sources.mjs                  événements + aides
//   node scripts/import_sources.mjs --intermarche    + offre étudiante Intermarché sur les magasins proches
//                                                    (⚠️ seulement après avoir vérifié la page officielle)
import { readFileSync, writeFileSync } from "node:fs";

const AGENT = "sharewood-student-project";
const today = new Date().toISOString().slice(0, 10);
const HORIZON = new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10);

/** Zones de l'application (src/lib/constants.ts). */
const ZONES = [
  { id: "bruz", lat: 48.0245, lng: -1.746, radiusM: 3000 },
  { id: "ker-lann", lat: 48.0505, lng: -1.742, radiusM: 1500 },
  { id: "rennes", lat: 48.1113, lng: -1.68, radiusM: 4000 },
];

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": AGENT }, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function km(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
/** Comme à la publication : la zone la plus proche si le lieu est dans ses environs. */
function zoneOf(point) {
  const [zone] = [...ZONES].sort((a, b) => km(point, a) - km(point, b));
  return km(point, zone) <= zone.radiusM / 1000 + 5 ? zone.id : null;
}

const clean = (t) => (t ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const cut = (t, max) => (t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`);
const sentence = (t) => (!t || /[.!?…]$/.test(t) ? t : `${t}.`);
const isLink = (u) => typeof u === "string" && /^https?:\/\/\S+$/.test(u) && u.length <= 500;

// ---------- 1. Événements gratuits ou avec tarif étudiant (OpenAgenda, Licence Ouverte) ----------
const CHILDREN = /\b(enfants?|jeune public|jeunesse|b[ée]b[ée]s?|tout-petits|petite enfance|scolaires?|seniors?|retrait[ée]s)\b|(d[èe]s|[àa] partir de) \d ans|\d+ ?[-à] ?\d+ ans/i;

async function events() {
  const base = "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/evenements-publics-openagenda/records";
  const where = `within_distance(location_coordinates, geom'POINT(-1.746 48.0245)', 15km) and lastdate_end>="${today}" and firstdate_begin<="${HORIZON}" and (search(conditions_fr, "gratuit") or search(conditions_fr, "étudiant"))`;
  const all = [];
  for (let offset = 0; offset < 500; offset += 100) {
    const page = await getJson(`${base}?${new URLSearchParams({ where, limit: "100", offset: String(offset), order_by: "firstdate_begin" })}`);
    all.push(...page.results);
    if (page.results.length < 100) break;
  }
  const usable = all.filter((e) => {
    const text = `${e.title_fr} ${e.description_fr} ${e.conditions_fr} ${(e.keywords_fr ?? []).join?.(" ") ?? e.keywords_fr}`;
    return (
      e.title_fr && e.location_coordinates && e.location_name && isLink(e.canonicalurl) &&
      !/r[ée]p[ée]tition|complet|annul[ée]/i.test(`${e.title_fr} ${e.conditions_fr}`) &&
      !CHILDREN.test(text) &&
      // Sur place uniquement : pas de rendez-vous en ligne sur une carte.
      /"id": ?1\b/.test(JSON.stringify(e.attendancemode ?? "").replaceAll('\\"', '"')) &&
      !/en ligne|visio/i.test(`${e.title_fr} ${e.location_name}`) &&
      !/doctorant|personnel|adh[ée]rent|abonn[ée]|r[ée]serv[ée] aux habitant/i.test(e.conditions_fr ?? "") &&
      (e.age_min == null || e.age_min <= 18) && (e.age_max == null || e.age_max >= 22) &&
      /"id": ?1\b/.test(typeof e.status === "string" ? e.status : JSON.stringify(e.status ?? { id: 1 }))
    );
  });
  // Bruz d'abord, puis les tarifs étudiants, puis par date ; 2 par lieu, 1 par titre.
  const score = (e) => (e.location_city === "Bruz" ? 0 : /[ée]tudiant/i.test(e.conditions_fr) ? 1 : 2);
  usable.sort((a, b) => score(a) - score(b) || a.firstdate_begin.localeCompare(b.firstdate_begin));
  const perPlace = new Map();
  const titles = new Set();
  const rows = [];
  for (const e of usable) {
    const key = clean(e.title_fr).toLowerCase();
    if (rows.length >= 30 || titles.has(key) || (perPlace.get(e.location_name) ?? 0) >= 2) continue;
    titles.add(key);
    perPlace.set(e.location_name, (perPlace.get(e.location_name) ?? 0) + 1);
    const point = { lat: e.location_coordinates.lat, lng: e.location_coordinates.lon };
    const conditions = clean(e.conditions_fr);
    const free = /gratuit|entr[ée]e libre/i.test(conditions) && !/€|euros?|payant/i.test(conditions);
    const text = `${e.title_fr} ${e.description_fr}`;
    rows.push({
      title: cut(clean(e.title_fr), 90),
      description: [sentence(cut(clean(e.description_fr), 220)), sentence(clean(e.daterange_fr)), `Tarif : ${sentence(cut(conditions, 140))}`].filter(Boolean).join(" "),
      category: /sport|rando|course|danse|yoga|escalade/i.test(text) ? "sport" : "activity",
      subcategory: null,
      scope: "local",
      zone_id: zoneOf(point),
      place_name: cut([e.location_name, e.location_city].filter(Boolean).join(" · "), 120),
      ...point,
      price_level: free ? 0 : null,
      tags: [/concert|musique|chant|chorale|orchestre/i.test(text) ? "music" : /cin[ée]|film|projection/i.test(text) ? "cinema" : "culture"],
      requirements: /r[ée]serv[ée] aux [ée]tudiant/i.test(conditions) ? ["student_card"] : [],
      expires_at: e.lastdate_end,
      link_url: e.canonicalurl,
      source_name: "OpenAgenda",
    });
  }
  return rows;
}

// ---------- 2. Aides aux étudiants (API Aides Jeunes, Licence Ouverte) ----------
/** Choisies à la main : identifiant de l'aide → rubrique et condition. */
const AIDS = {
  bourse_criteres_sociaux: {},
  aide_mobilite_internationale_eligibilite: { requirements: ["scholarship"] },
  aide_merite_montant: { requirements: ["scholarship"] },
  aide_mobilite_master: {},
  crous_repas_montant: { category: "restaurant" },
  crous_logement_eligibilite: {},
  "residences-etudiantes-loyer-modere": {},
  "aide-colocations-solidaire-pour-les-etudiants": {},
  aide_alimentation_etudiants_eloignes: {},
  garantie_pret_etudiant_eligibilite: {},
  seances_sante_psy_etudiant: {},
  carte_sncf_eleve_apprenti_eligibilite: { category: "transport", subcategory: "train" },
  "region-bretagne-abonnement-breizhgo": { category: "transport", subcategory: "train" },
  "bretagne-jeune-international": {},
  "bretagne-b-monde-individuel": {},
};

async function aids() {
  const all = await getJson("https://mes-aides.1jeune1solution.beta.gouv.fr/api/benefits");
  const rows = [];
  for (const [slug, extra] of Object.entries(AIDS)) {
    const aid = all.find((a) => a.slug === slug || a.id === slug);
    if (!aid) { console.warn("Aide introuvable :", slug); continue; }
    const link = aid.link ?? aid.instructions ?? aid.teleservice;
    if (!isLink(link) || (aid.endDate && aid.endDate < today)) { console.warn("Aide ignorée (lien ou date) :", slug); continue; }
    const institution = aid.institution?.label ?? "";
    const regional = institution === "Bretagne";
    const label = clean(aid.label);
    const title = label.charAt(0).toUpperCase() + label.slice(1);
    rows.push({
      title: cut(regional ? `Bretagne : ${title}` : title, 90),
      description: `${sentence(cut(clean(aid.description), 330))} Proposé par : ${institution}. Conditions et montants sur la page officielle.`,
      category: extra.category ?? "scholarship",
      subcategory: extra.subcategory ?? null,
      scope: "national", zone_id: null, place_name: null, lat: null, lng: null, price_level: null, tags: [],
      requirements: extra.requirements ?? [],
      expires_at: aid.endDate ? `${aid.endDate}T23:59:59+01:00` : null,
      link_url: link,
      source_name: "Aides Jeunes (1jeune1solution)",
    });
  }
  return rows;
}

// ---------- 3. Offre étudiante Intermarché (vérifiée à la main) sur les magasins proches (OpenStreetMap) ----------
const INTERMARCHE_URL = "https://www.intermarche.com/avantages-fidelite/avantage-etudiants";

function intermarche() {
  const stores = JSON.parse(readFileSync(new URL("./intermarche_stores.json", import.meta.url), "utf8"));
  return stores.map((s) => ({
    title: "Étudiants : 10 % sur la carte Intermarché",
    description:
      "De 18 à 28 ans, étudiant en France : 10 % crédités sur la carte de fidélité pour les produits des marques Intermarché (hors Top Budget, Merci et poids variable), 20 € maximum par mois. Inscription dans « Mon compte > Mes avantages ». Conditions à confirmer en magasin. Lieu : © les contributeurs d'OpenStreetMap.",
    category: "supermarket", subcategory: null, scope: "local",
    zone_id: zoneOf(s), place_name: s.name, lat: s.lat, lng: s.lng, price_level: null, tags: [],
    requirements: ["student_card"], expires_at: null, link_url: INTERMARCHE_URL, source_name: "intermarche.com",
  }));
}

// ---------- SQL ----------
const q = (v) => (v === null || v === undefined ? "null" : typeof v === "number" ? String(v) : `'${String(v).replaceAll("'", "''")}'`);
const list = (a) => `array[${a.map(q).join(", ")}]::text[]`;

const rows = [...(await events()), ...(await aids()), ...(process.argv.includes("--intermarche") ? intermarche() : [])];
const values = rows.map((r, i) =>
  `    (${[q(r.title), q(r.description), q(r.category), q(r.subcategory), q(r.scope), q(r.zone_id), q(r.place_name), q(r.lat), q(r.lng), q(r.price_level), list(r.tags), list(r.requirements), q(r.expires_at), q(r.link_url), q(r.source_name), i].join(", ")})`,
);

const sql = `-- =====================================================================
-- ShareWood — offres issues de sources publiques, récupérées le ${today} par scripts/import_sources.mjs.
-- ${rows.length} offres. NE PAS MODIFIER À LA MAIN : relancer le script.
-- Prérequis : migration 024_deal_source.sql. À coller dans Supabase → SQL Editor → Run.
-- À relancer après reset_demo.sql (qui efface le compte « Sources publiques »).
-- Relançable : remplace les offres importées auparavant (et leurs réactions).
-- Sources : OpenAgenda (Licence Ouverte), Aides Jeunes (Licence Ouverte)${process.argv.includes("--intermarche") ? ", intermarche.com, lieux © OpenStreetMap (ODbL)" : ""}.
-- =====================================================================
do $import$
declare
  bot uuid;
  bot_email constant text := 'sources@example.com';
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'deals' and column_name = 'source_name') then
    raise exception 'Lance d''abord supabase/migrations/024_deal_source.sql.';
  end if;

  -- Compte technique, auteur des offres importées : mot de passe aléatoire jamais communiqué.
  select id into bot from auth.users where email = bot_email;
  if bot is null then
    bot := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', bot, 'authenticated', 'authenticated', bot_email,
      extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"username":"Sources publiques"}', now(), now(), '', '', '', '');
  end if;

  delete from public.deals where author_id = bot;

  insert into public.deals (title, description, category, subcategory, scope, zone_id, place_name, lat, lng,
    price_level, tags, requirements, expires_at, link_url, source_name, source_checked_at, author_id, created_at)
  select v.title, v.description, v.category::deal_category, v.subcategory::deal_subcategory, v.scope::deal_scope,
    v.zone_id, v.place_name, v.lat::double precision, v.lng::double precision, v.price_level::int, v.tags,
    v.requirements, v.expires_at::timestamptz, v.link_url, v.source_name, date '${today}', bot,
    now() - make_interval(mins => 30 + v.rank * 7)
  from (values
${values.join(",\n")}
  ) as v(title, description, category, subcategory, scope, zone_id, place_name, lat, lng, price_level, tags,
         requirements, expires_at, link_url, source_name, rank);
end $import$;

select source_name, count(*) as offres from public.deals where source_name is not null group by 1 order by 1;
`;

writeFileSync(new URL("../supabase/import_sources.sql", import.meta.url), sql);
const by = Object.groupBy(rows, (r) => r.source_name);
console.log("supabase/import_sources.sql :", Object.entries(by).map(([k, v]) => `${k} ${v.length}`).join(" · "));
