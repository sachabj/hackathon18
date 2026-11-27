"use client";

// Message bref au gain (ou non) de Flèches, au-dessus de toute l'application.
import { useEffect, useState } from "react";
import { ArrowShotIcon } from "@/components/icons";
import { onArrows, type ArrowNotice } from "@/lib/arrows";

const DURATION_MS = 4000;

export default function ArrowToast() {
  const [notice, setNotice] = useState<(ArrowNotice & { key: number }) | null>(null);

  useEffect(() => onArrows((n) => n && setNotice({ ...n, key: Date.now() })), []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  // La région reste en place pour que les lecteurs d'écran annoncent chaque message.
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 bottom-20 z-[2200] lg:bottom-8 flex justify-center px-4">
      {notice && (
        <div
          key={notice.key}
          className="sw-toast flex max-w-sm items-center gap-3 rounded-2xl px-4 py-3 shadow-lg"
          style={{ backgroundColor: "var(--color-forest)", color: "var(--color-surface)" }}
        >
          <ArrowShotIcon className="sw-toast-arrow h-6 w-6 shrink-0 text-[var(--color-sage)]" />
          <span>
            <span className="block font-medium">{notice.title}</span>
            {notice.detail && <span className="block text-sm opacity-90">{notice.detail}</span>}
          </span>
        </div>
      )}
    </div>
  );
}
