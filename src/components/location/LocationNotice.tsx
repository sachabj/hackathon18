import Link from "next/link";
import { LockClosedIcon } from "@/components/icons";

/** Mention « position sécurisée », affichée là où la position est partagée. Ne rien y promettre que le code ne fait pas. */
export default function LocationNotice({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`flex items-start gap-1.5 text-xs text-[var(--color-muted)] ${className}`}>
      <LockClosedIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-forest)]" />
      <span>
        <strong style={{ color: "var(--color-forest)" }}>Position sécurisée.</strong> {children}{" "}
        <Link href="/confidentialite#localisation" target="_blank" className="underline">
          En savoir plus
        </Link>
      </span>
    </p>
  );
}
