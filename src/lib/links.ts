// Liens des bons plans : champ « lien » (deals.link_url, migration 012) et URL écrites dans le texte.
import { LINK_MAX } from "./constants";

/**
 * Saisie de l'étudiant → lien à enregistrer. « www.exemple.fr » devient « https://www.exemple.fr ».
 * Renvoie null si le champ est vide ; lève une erreur lisible si ce n'est pas un lien web.
 */
export function normalizeLink(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error("Le lien n'est pas valide (ex : https://www.exemple.fr/offre).");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Seuls les liens http(s) sont acceptés.");
  if (!url.hostname.includes(".")) throw new Error("Le lien n'est pas valide (ex : https://www.exemple.fr/offre).");
  const href = url.href;
  if (href.length > LINK_MAX) throw new Error(`Le lien est trop long (${LINK_MAX} caractères maximum).`);
  return href;
}

/** Lien enregistré → lien sûr à afficher (jamais de javascript:, data:…), sinon null. */
export function safeLink(href: string | null | undefined): string | null {
  if (!href) return null;
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

/** Nom de site court pour le bouton : « bruz.cineville.fr ». */
export function linkHost(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

const URL_IN_TEXT = /https?:\/\/[^\s<>"']+/gi;
/** Ponctuation collée à la fin d'une URL dans une phrase (« voir https://x.fr. »). */
const TRAILING = /[.,;:!?)\]}»]+$/;

export type TextPart = { text: string; href?: string };

/** Découpe un texte en morceaux, les URL http(s) devenant des liens. */
export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_IN_TEXT)) {
    const start = match.index ?? 0;
    const url = match[0].replace(TRAILING, "");
    const href = safeLink(url);
    if (!href) continue;
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ text: url, href });
    last = start + url.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
