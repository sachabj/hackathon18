"use client";

// Logo animé à l'ouverture de l'appli (tâche 82) : au moins 0,5 s, plus longtemps si elle charge encore.
// Rendu dès le HTML (visible avant le JavaScript) ; le layout n'étant monté qu'au lancement ou au rechargement,
// il ne réapparaît pas en changeant d'onglet. Dessin identique à `public/logo.svg`.
import { useEffect, useState } from "react";

const MIN_MS = 500;
/** Au-delà, on laisse voir l'application même si elle charge encore (réseau coupé…). */
const MAX_MS = 4000;
const FADE_MS = 180;

export default function LaunchSplash() {
  const [step, setStep] = useState<"shown" | "leaving" | "gone">("shown");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    // `performance.now()` : temps écoulé depuis l'ouverture de la page.
    const check = () => {
      const elapsed = performance.now();
      const loading = !!document.querySelector("[data-app-loading]");
      if (elapsed >= MAX_MS || (elapsed >= MIN_MS && !loading)) {
        setStep("leaving");
        timer = setTimeout(() => setStep("gone"), FADE_MS);
      } else timer = setTimeout(check, 60);
    };
    check();
    return () => clearTimeout(timer);
  }, []);

  if (step === "gone") return null;
  return (
    <div aria-hidden className={`sw-splash ${step === "leaving" ? "sw-splash-leaving" : ""}`}>
      <svg viewBox="0 0 120 120" width="112" height="112" className="sw-splash-logo">
        <circle cx="60" cy="60" r="60" fill="#1E3A2F" />
        <svg x="14" y="14" width="92" height="92" viewBox="12 21 92 92" overflow="visible">
          <g transform="rotate(-30 58 68)">
            {/* L'étiquette se balance autour de son œillet. */}
            <g className="sw-splash-tag">
              <path d="M34 48 H70 L90 68 L70 88 H34 A7 7 0 0 1 27 81 V55 A7 7 0 0 1 34 48 Z" fill="#FAF9F5" />
              <circle cx="75" cy="68" r="4.5" fill="#1E3A2F" />
              <polygon points="48,56 64,62.5 48,69 32,62.5" fill="#4B2A63" />
              <path d="M39 65.5 V72 C39 77.5 57 77.5 57 72 V65.5 L48 69.5 Z" fill="#4B2A63" />
            </g>
          </g>
        </svg>
      </svg>
    </div>
  );
}
