"use client";

// Menu des réglages, à la manière d'une application mobile : groupes, liens et sections dépliables.
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ChevronDownIcon } from "@/components/icons";

type Icon = ComponentType<{ className?: string }>;

export function MenuGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="sw-eyebrow mb-1.5 px-1">{title}</h2>
      <ul className="sw-card divide-y divide-[var(--color-border)] overflow-hidden">{children}</ul>
    </section>
  );
}

function Row({ Icon, title, hint, end }: { Icon: Icon; title: string; hint: string; end: ReactNode }) {
  return (
    <>
      <Icon className="h-5 w-5 shrink-0 text-[var(--color-forest)]" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-[var(--color-muted)]">{hint}</span>
      </span>
      {end}
    </>
  );
}

export function MenuLink({ href, ...row }: { href: string; Icon: Icon; title: string; hint: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 p-3">
        <Row {...row} end={<span aria-hidden className="text-[var(--color-muted)]">›</span>} />
      </Link>
    </li>
  );
}

/** Section dépliable : son contenu n'existe que lorsqu'elle est ouverte (les champs saisis sont oubliés ensuite). */
export function MenuSection<T extends string>({
  id,
  open,
  onToggle,
  children,
  ...row
}: {
  id: T;
  open: T | null;
  onToggle: (id: T | null) => void;
  Icon: Icon;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  const expanded = open === id;
  return (
    <li id={`reglage-${id}`}>
      <button
        type="button"
        onClick={() => onToggle(expanded ? null : id)}
        aria-expanded={expanded}
        aria-controls={`reglage-${id}-contenu`}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <Row {...row} end={<ChevronDownIcon className={`h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform ${expanded ? "rotate-180" : ""}`} />} />
      </button>
      {expanded && (
        <div id={`reglage-${id}-contenu`} className="sw-menu-panel space-y-4 px-3 pb-4 pt-1">
          {children}
        </div>
      )}
    </li>
  );
}
