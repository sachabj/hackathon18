"use client";

// Tâche 75 : au gain de Flèches, une pastille « +N » part de l'endroit touché et s'envole vers le solde affiché
// (`[data-arrow-target]`, voir ArrowBadge), qui grossit un instant à l'arrivée. Purement décoratif : le message
// (ArrowToast) reste la seule annonce pour les lecteurs d'écran.
import { useEffect, useState } from "react";
import { ArrowShotIcon } from "@/components/icons";
import { onArrows } from "@/lib/arrows";
import { prefersReducedMotion } from "@/lib/motion";

type Point = { x: number; y: number };
type Flight = { id: number; gain: number; from: Point; to: Point | null };

/** Au-delà, le dernier toucher ne correspond plus au gain annoncé : départ du bas de l'écran. */
const TOUCH_MAX_AGE_MS = 15_000;

function visibleTarget(): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>("[data-arrow-target]")) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight) return el;
  }
  return null;
}

function center(el: Element): Point {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export default function ArrowFlight() {
  const [flights, setFlights] = useState<Flight[]>([]);

  useEffect(() => {
    let last: (Point & { at: number }) | null = null;
    const remember = (e: PointerEvent) => (last = { x: e.clientX, y: e.clientY, at: Date.now() });
    window.addEventListener("pointerdown", remember, { capture: true, passive: true });
    const stop = onArrows((notice) => {
      if (!notice?.gain || notice.gain <= 0 || prefersReducedMotion()) return;
      const from =
        last && Date.now() - last.at < TOUCH_MAX_AGE_MS
          ? { x: last.x, y: last.y }
          : { x: window.innerWidth / 2, y: window.innerHeight - 96 };
      const target = visibleTarget();
      setFlights((list) => [...list, { id: Date.now() + Math.random(), gain: notice.gain!, from, to: target ? center(target) : null }]);
    });
    return () => {
      window.removeEventListener("pointerdown", remember, { capture: true });
      stop();
    };
  }, []);

  /** Lance l'envol dès que la pastille est posée, puis la retire. */
  function launch(el: HTMLElement | null, f: Flight) {
    if (!el || el.dataset.launched) return;
    el.dataset.launched = "1";
    const done = () => setFlights((list) => list.filter((x) => x.id !== f.id));
    if (typeof el.animate !== "function") return done();
    // Sans solde visible (en-tête hors de l'écran) : la pastille monte et s'efface.
    const to = f.to ?? { x: f.from.x, y: Math.max(24, f.from.y - 160) };
    const dx = to.x - f.from.x;
    const dy = to.y - f.from.y;
    // Trajectoire en arc : x régulier, y qui monte d'abord au-dessus de la ligne droite.
    const lift = Math.min(90, Math.abs(dy) * 0.35 + 30);
    const frames: Keyframe[] = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = dx * t;
      const y = dy * t - lift * 4 * t * (1 - t);
      const scale = i === 0 ? 0.6 : i === 1 ? 1.15 : 1 - 0.4 * t;
      const opacity = i === 0 ? 0 : f.to ? 1 : 1 - t;
      frames.push({ transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`, opacity, offset: t });
    }
    el.animate(frames, { duration: 750, easing: "cubic-bezier(0.4, 0, 0.6, 1)", fill: "forwards" }).finished.then(() => {
      const target = f.to && visibleTarget();
      target?.animate?.(
        [{ transform: "scale(1)" }, { transform: "scale(1.22)" }, { transform: "scale(1)" }],
        { duration: 360, easing: "cubic-bezier(0.2, 1.4, 0.4, 1)" },
      );
      done();
    }, done);
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[2300]">
      {flights.map((f) => (
        <span
          key={f.id}
          ref={(el) => launch(el, f)}
          className="absolute flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums shadow-md"
          style={{
            left: f.from.x,
            top: f.from.y,
            opacity: 0,
            backgroundColor: "var(--color-sage)",
            color: "var(--color-forest)",
          }}
        >
          +{f.gain}
          <ArrowShotIcon className="h-4 w-4" />
        </span>
      ))}
    </div>
  );
}
