import Link from "next/link";

/** Accès à la page « Compte et confidentialité » depuis les profils étudiant et commerçant. */
export default function AccountLink() {
  return (
    <Link href="/compte" className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-3">
      <span className="flex-1">
        <span className="block font-semibold">Compte et confidentialité</span>
        <span className="block text-sm text-zinc-500">Mot de passe, appareils, mes données, suppression</span>
      </span>
      <span aria-hidden className="text-zinc-400">›</span>
    </Link>
  );
}
