"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/lib/useRole";

const LINKS = [
  { href: "/", label: "Carte", emoji: "🗺️" },
  { href: "/publier", label: "Signaler", emoji: "➕" },
  { href: "/favoris", label: "Favoris", emoji: "❤️" },
  { href: "/profil", label: "Profil", emoji: "👤" },
];

const MERCHANT_LINKS = [
  { href: "/commercant", label: "Offres", emoji: "🏷️" },
  { href: "/commercant/statistiques", label: "Statistiques", emoji: "📊" },
  { href: "/commercant/compte", label: "Compte", emoji: "🏪" },
];

export default function NavBar() {
  const pathname = usePathname();
  const role = useRole(pathname);
  if (!role || pathname.startsWith("/login") || pathname.startsWith("/onboarding")) return null;
  const links = role === "merchant" ? MERCHANT_LINKS : LINKS;
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[1000] border-t border-black/10 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex max-w-md justify-around">
        {links.map((l) => {
          // Les pages d'accueil de chaque interface ne sont actives que sur leur adresse exacte.
          const active =
            l.href === "/" || l.href === "/commercant" ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`flex flex-col items-center px-3 py-2 text-xs ${active ? "text-blue-600 font-semibold" : "text-zinc-500"}`}
              >
                <span className="text-xl">{l.emoji}</span>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
