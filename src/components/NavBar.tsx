"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ArrowBadge from "@/components/arrows/ArrowBadge";
import { ChartIcon, HeartArrowIcon, HomeIcon, PlusIcon, SearchIcon, StoreIcon, TagIcon, UserIcon } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useRole } from "@/lib/useRole";

const LINKS = [
  { href: "/", label: "Accueil", Icon: HomeIcon },
  { href: "/recherche", label: "Recherche", Icon: SearchIcon },
  { href: "/publier", label: "Partager", Icon: PlusIcon },
  { href: "/favoris", label: "Ciblés", Icon: HeartArrowIcon },
  { href: "/profil", label: "Profil", Icon: UserIcon },
];

const MERCHANT_LINKS = [
  { href: "/commercant", label: "Offres", Icon: TagIcon },
  { href: "/commercant/statistiques", label: "Statistiques", Icon: ChartIcon },
  { href: "/commercant/compte", label: "Compte", Icon: StoreIcon },
];

export default function NavBar() {
  const pathname = usePathname();
  const role = useRole(pathname);
  const hidden = ["/login", "/onboarding", "/confidentialite"].some((p) => pathname.startsWith(p));
  if (!role || hidden) return null;
  const links = role === "merchant" ? MERCHANT_LINKS : LINKS;
  return (
    // En bas sur téléphone, en haut sur ordinateur (marges de la page : `.sw-nav` dans globals.css).
    <nav
      className="sw-nav fixed bottom-0 inset-x-0 z-[1000] border-t backdrop-blur lg:bottom-auto lg:top-0 lg:border-b lg:border-t-0"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "color-mix(in srgb, var(--color-surface) 95%, transparent)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="lg:mx-auto lg:flex lg:h-[calc(4rem-1px)] lg:max-w-6xl lg:items-center lg:gap-4 lg:px-4">
        <Link href={links[0].href} className="hidden w-44 shrink-0 items-center gap-2 lg:flex">
          {/* eslint-disable-next-line @next/next/no-img-element -- petit logo statique, SVG */}
          <img src="/logo.svg" alt="" width={32} height={32} aria-hidden />
          <span className="font-serif text-xl" style={{ color: "var(--color-ink)" }}>{APP_NAME}</span>
        </Link>
        <ul className="mx-auto flex max-w-md justify-around lg:max-w-none lg:flex-1 lg:justify-center lg:gap-1">
        {links.map((l) => {
          // Les pages d'accueil de chaque interface ne sont actives que sur leur adresse exacte.
          const active =
            l.href === "/" || l.href === "/commercant" ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs lg:flex-row lg:gap-2 lg:rounded-full lg:px-4 lg:text-sm ${
                  active ? "lg:bg-[var(--color-sage)]" : "lg:hover:bg-[var(--color-paper)]"
                }`}
                style={active ? { color: "var(--color-forest)", fontWeight: 500 } : { color: "var(--color-muted)" }}
              >
                <l.Icon className="h-5 w-5" />
                {l.label}
              </Link>
            </li>
          );
        })}
        </ul>
        {/* Même largeur que le logo : les onglets restent au centre. */}
        <div className="hidden w-44 shrink-0 justify-end lg:flex">{role === "student" && <ArrowBadge />}</div>
      </div>
    </nav>
  );
}
