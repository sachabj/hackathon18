"use client";

// Micro-animations (tâche 75) : outils partagés. Toujours coupées si le téléphone demande moins d'animations.
import { useLayoutEffect, useRef, useState } from "react";

/** Le système demande moins d'animations (réglage d'accessibilité). */
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Suit les changements d'une valeur après le premier affichage : `count` vaut 0 au montage puis augmente à chaque
 * changement (à utiliser comme `key` pour rejouer une animation CSS), `prev` est la valeur précédente.
 */
export function useChanges<T>(value: T) {
  const [state, setState] = useState({ value, prev: value, count: 0 });
  if (!Object.is(state.value, value)) {
    const next = { value, prev: state.value, count: state.count + 1 };
    setState(next);
    return next;
  }
  return state;
}

const CASCADE_MAX = 8;
const CASCADE_STEP_MS = 45;

/**
 * Cartes qui arrivent l'une après l'autre : rejoué à chaque changement de `trigger` (chargement, filtres) sur les
 * éléments `[data-cascade]` du conteneur. Sans remonter les cartes (leurs réactions locales sont gardées).
 */
export function useCascade<T extends HTMLElement>(trigger: string) {
  const ref = useRef<T>(null);
  // Avant l'affichage, pour ne pas montrer les cartes une fraction de seconde avant leur entrée.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion() || typeof root.animate !== "function") return;
    root.querySelectorAll<HTMLElement>("[data-cascade]").forEach((el, i) => {
      if (i >= CASCADE_MAX) return;
      el.animate(
        [
          { opacity: 0, transform: "translateY(14px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 340, delay: i * CASCADE_STEP_MS, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "backwards" },
      );
    });
  }, [trigger]);
  return ref;
}
