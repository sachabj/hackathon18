// Langue de l'interface (tâche 50) : français ou anglais. Responsable : Sacha.
// Les textes restent écrits en français dans le code ; `t("Texte")` renvoie la traduction de `en.ts` en anglais.
// Variables : t("Encore {n} Flèches", { n: 3 }). Les offres, elles, restent dans la langue où elles sont écrites.
import { useCallback, useSyncExternalStore } from "react";
import { EN } from "./en";

export type Lang = "fr" | "en";
const KEY = "sw-lang";
const listeners = new Set<() => void>();

/** Choix enregistré sur l'appareil, sinon la langue du navigateur. */
export function getLang(): Lang {
  if (typeof window === "undefined") return "fr";
  const saved = window.localStorage.getItem(KEY);
  if (saved === "fr" || saved === "en") return saved;
  return navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

/** Change de langue et recharge la page : tous les textes, y compris ceux déjà calculés, sont refaits. */
export function setLang(lang: Lang) {
  window.localStorage.setItem(KEY, lang);
  listeners.forEach((l) => l());
  window.location.reload();
}

type Vars = Record<string, string | number | null | undefined>;

function translate(lang: Lang, fr: string, vars?: Vars) {
  let text = fr;
  if (lang === "en") {
    const en = EN[fr];
    if (en !== undefined) text = en;
    else if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
      // Repérer les oublis pendant le développement.
      ((window as unknown as { __missing?: Set<string> }).__missing ??= new Set()).add(fr);
    }
  }
  return vars ? text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? "")) : text;
}

/** Traduction hors composant (messages calculés après le chargement : notifications, raisons…). */
export const tr = (fr: string, vars?: Vars) => translate(getLang(), fr, vars);

/** Langue courante ; « fr » pendant le rendu serveur puis l'hydratation (pas de décalage). */
export function useLang(): Lang {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getLang,
    () => "fr",
  );
}

/** `t` pour les composants. */
export function useT() {
  const lang = useLang();
  return useCallback((fr: string, vars?: Vars) => translate(lang, fr, vars), [lang]);
}

/** Pour les dates : `toLocaleDateString(dateLocale(), …)`. */
export const dateLocale = () => (getLang() === "en" ? "en-GB" : "fr-FR");
export const useDateLocale = () => (useLang() === "en" ? "en-GB" : "fr-FR");
