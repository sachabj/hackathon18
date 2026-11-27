import Link from "next/link";
import { ChartIcon, HeartIcon, PlusIcon, TicketIcon } from "@/components/icons";

const SHORTCUTS = [
  { href: "/favoris?onglet=activite", label: "Mes bons plans", Icon: ChartIcon },
  { href: "/favoris?onglet=favoris", label: "Mes favoris", Icon: HeartIcon },
  { href: "/favoris?onglet=recompenses", label: "Récompenses", Icon: TicketIcon },
  { href: "/publier", label: "Partager", Icon: PlusIcon },
];

/** Raccourcis du profil vers les écrans les plus utilisés. */
export default function ProfileShortcuts() {
  return (
    <nav aria-label="Raccourcis">
      <ul className="grid grid-cols-2 gap-2">
        {SHORTCUTS.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link href={href} className="sw-card flex h-full items-center gap-2 p-3 text-sm font-medium">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--color-sage)", color: "var(--color-forest)" }}
              >
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
