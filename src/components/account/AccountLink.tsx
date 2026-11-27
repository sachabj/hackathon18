import Link from "next/link";

/** Accès à la page « Compte et confidentialité » depuis les profils étudiant et commerçant. */
export default function AccountLink() {
  return (
    <Link href="/compte" className="sw-card flex items-center gap-3 p-3">
      <span className="flex-1">
        <span className="block font-medium">Compte et confidentialité</span>
        <span className="block text-sm text-[var(--color-muted)]">Mot de passe, appareils, mes données, suppression</span>
      </span>
      <span aria-hidden className="text-[var(--color-muted)]">›</span>
    </Link>
  );
}
