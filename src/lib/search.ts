// Recherche (page /recherche) : parmi les bons plans déjà chargés (la saisie n'est envoyée à aucun serveur).
// Comprend les accents, les pluriels, les abréviations (SAME), les fautes de frappe et des mots proches (RELATED).
import { ACTIVITIES, CATEGORIES, REQUIREMENTS, SUBCATEGORIES } from "./constants";
import { isBoosted } from "./merchant";
import type { Deal } from "./types";
import { zoneById } from "./zones";

/** Façons d'écrire la même chose : trouver l'une compte comme un résultat exact. */
const SAME = [
  ["cine", "cinema"],
  ["resto", "restau", "restaurant"],
  ["mcdo", "macdo", "mcdonald"],
  ["muscu", "musculation"],
  ["covoit", "covoiturage"],
];

/**
 * Ce que tape l'étudiant (à gauche) → mots aussi cherchés (à droite), pour les « résultats proches ».
 * Écrire sans accents ; le pluriel est géré. Une expression de plusieurs mots est autorisée à droite.
 */
const RELATED: [string[], string[]][] = [
  // Manger et boire
  [["kebab", "kebap", "doner", "grec"], ["kebab", "doner", "tacos", "grec"]],
  [["tacos", "taco"], ["tacos", "kebab"]],
  [["burger", "hamburger"], ["burger", "mcdonald", "mcdo", "quick", "kfc"]],
  [["pizza", "pizzeria"], ["pizza", "pizzeria"]],
  [["sandwich", "panini"], ["sandwich", "panini", "subway", "boulangerie"]],
  [["pain", "boulangerie", "viennoiserie", "croissant"], ["boulangerie", "fournee", "viennoiserie"]],
  [["crepe", "galette", "creperie"], ["crepe", "galette", "creperie"]],
  [["manger", "repas", "dejeuner", "diner"], ["restaurant", "menu", "plat"]],
  [["bar", "biere", "boire", "verre", "pinte", "apero"], ["bar", "bistrot", "biere", "pub", "happy hour"]],
  // Courses
  [
    ["course", "supermarche", "hypermarche", "alimentation"],
    ["grandes surfaces", "supermarche", "intermarche", "leclerc", "carrefour", "lidl"],
  ],
  // Sorties et sport
  [["film", "seance"], ["cine", "cinema"]],
  [["concert", "musique", "festival"], ["concerts", "musique", "festival"]],
  [["soiree", "fete", "boite"], ["soirees", "happy hour"]],
  [["musee", "expo", "exposition", "theatre", "spectacle"], ["musee", "exposition", "theatre", "spectacle", "culture"]],
  [["muscu", "musculation", "fitness", "gym"], ["fitness", "musculation", "salle de sport"]],
  [["piscine", "natation", "nager"], ["piscine", "natation", "aquatique"]],
  // Transports
  [["train", "sncf", "ter", "tgv"], ["train", "sncf", "ter", "tgv", "ouigo"]],
  [["bus", "metro", "star"], ["bus", "metro", "star"]],
  [["avion", "vol"], ["avion", "vol", "aerien"]],
  [["blablacar"], ["covoiturage"]],
  [["covoit", "covoiturage"], ["blablacar"]],
  // Aides et prix
  [["bourse", "boursier", "aide", "crous"], ["bourse", "boursiers", "aide", "crous"]],
  [["gratuit", "offert"], ["gratuit", "offert"]],
];

/** Petits mots ignorés quand la saisie en contient d'autres (« un kebab à Bruz »). */
const STOP_WORDS = new Set(
  "a au aux avec chez cherche d dans de des du en et j je l la le les ma mes mon pour sur un une".split(" "),
);

/** Mots sans majuscules, accents ni ponctuation. */
export const tokenize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/** Singulier approximatif, appliqué des deux côtés (« kebabs » = « kebab »). */
const stem = (word: string) => (word.length > 3 ? word.replace(/[sx]$/, "") : word);

/** Nombre de fautes entre deux mots : lettre ajoutée, oubliée, remplacée ou deux lettres inversées. */
function typos(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** Textes d'un bon plan et leur importance : le titre d'abord, puis le lieu, les étiquettes, la description. */
function fields(deal: Deal) {
  const zone = deal.scope === "national" ? "Partout en France" : zoneById(deal.zone_id)?.name;
  const labels = [
    CATEGORIES[deal.category].label,
    deal.subcategory && SUBCATEGORIES[deal.subcategory].label,
    ...(deal.tags ?? []).map((t) => ACTIVITIES[t as keyof typeof ACTIVITIES]?.label),
    ...(deal.requirements ?? []).map((r) => REQUIREMENTS[r].label),
  ];
  return [
    { weight: 10, text: deal.title },
    { weight: 6, text: deal.place_name },
    { weight: 4, text: labels.filter(Boolean).join(" ") },
    { weight: 3, text: deal.description },
    { weight: 2, text: [deal.price_info, zone].filter(Boolean).join(" ") },
  ].map(({ weight, text }) => ({ weight, words: tokenize(text ?? "") }));
}

type Fields = ReturnType<typeof fields>;

/** Meilleur score d'un mot saisi dans un bon plan : 0 s'il n'y est pas. */
const score = (doc: Fields, match: (words: string[]) => number) =>
  Math.max(0, ...doc.map((f) => f.weight * match(f.words)));

/** Le mot lui-même : entier (1), début d'un mot (0,8) ou milieu d'un mot (0,6, dès 5 lettres : « cine » ≠ « piscine »). */
const direct = (word: string) => (words: string[]) => {
  const root = stem(word);
  return Math.max(
    0,
    ...words.map((w) =>
      stem(w) === root ? 1 : w.startsWith(root) ? 0.8 : root.length >= 5 && w.includes(root) ? 0.6 : 0,
    ),
  );
};

/** Un mot proche : seulement des mots entiers (« bar » ne doit pas ramener « barbecue »). */
const related = (phrases: string[][]) => (words: string[]) => {
  const roots = new Set(words.map(stem));
  return phrases.some((phrase) => phrase.every((p) => roots.has(stem(p)))) ? 0.5 : 0;
};

/** Faute de frappe : une à partir de 4 lettres, deux à partir de 8, première lettre juste. */
const misspelt = (word: string) => (words: string[]) => {
  const root = stem(word);
  const allowed = root.length < 4 ? 0 : root.length < 8 ? 1 : 2;
  return allowed > 0 && words.some((w) => w[0] === root[0] && typos(root, stem(w)) <= allowed) ? 0.4 : 0;
};

/** Les mots à chercher ; vide si la saisie ne contient ni lettre ni chiffre. */
export function queryWords(query: string) {
  const words = tokenize(query);
  const useful = words.filter((w) => !STOP_WORDS.has(w));
  return useful.length > 0 ? useful : words;
}

/**
 * Bons plans correspondant à tous les mots saisis, les plus pertinents d'abord.
 * `exact` : chaque mot est présent. `close` : au moins un mot n'est trouvé que par un mot proche ou une faute.
 * À pertinence égale, l'ordre de la liste reçue est conservé.
 */
export function searchDeals<T extends { deal: Deal }>(items: T[], query: string) {
  const docs = items.map((item) => ({ item, doc: fields(item.deal), total: 0, found: true, isClose: false }));

  for (const word of queryWords(query)) {
    const forms = SAME.find((group) => group.some((w) => stem(w) === stem(word))) ?? [word];
    const hits = docs.map((d) => Math.max(...forms.map((form) => score(d.doc, direct(form)))));
    // Les fautes de frappe ne sont tolérées que si le mot tel quel n'existe dans aucune offre.
    const unknown = hits.every((h) => h === 0);
    const synonyms = RELATED.filter(([typed]) => typed.some((t) => stem(t) === stem(word))).flatMap(([, others]) =>
      others.map(tokenize),
    );
    docs.forEach((d, i) => {
      if (hits[i] > 0) {
        d.total += hits[i];
        return;
      }
      const near = Math.max(
        synonyms.length > 0 ? score(d.doc, related(synonyms)) : 0,
        unknown ? score(d.doc, misspelt(word)) : 0,
      );
      d.total += near;
      d.isClose ||= near > 0;
      d.found &&= near > 0;
    });
  }

  // Offres mises en avant en tête de chaque groupe, puis par pertinence.
  const sorted = docs
    .filter((d) => d.found)
    .sort((a, b) => Number(isBoosted(b.item.deal)) - Number(isBoosted(a.item.deal)) || b.total - a.total);
  return {
    exact: sorted.filter((d) => !d.isClose).map((d) => d.item),
    close: sorted.filter((d) => d.isClose).map((d) => d.item),
  };
}
