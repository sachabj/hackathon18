"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/icons";

/** Fenêtre par-dessus la page, depuis le bas de l'écran. */
export default function Modal({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-4 pb-6"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--color-paper)" }}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
