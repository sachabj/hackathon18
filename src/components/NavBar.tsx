"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsMerchant } from "@/lib/useIsMerchant";

const LINKS = [
  { href: "/", label: "Carte", emoji: "🗺️" },
  { href: "/publier", label: "Signaler", emoji: "➕" },
  { href: "/favoris", label: "Favoris", emoji: "❤️" },
  { href: "/profil", label: "Profil", emoji: "👤" },
];

export default function NavBar() {
  const pathname = usePathname();
  const merchant = useIsMerchant(pathname);
  const links = merchant ? [...LINKS, { href: "/commercant", label: "Commerce", emoji: "🏪" }] : LINKS;
  if (pathname.startsWith("/login") || pathname.startsWith("/onboarding")) return null;
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[1000] border-t border-black/10 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex max-w-md justify-around">
        {links.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
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
