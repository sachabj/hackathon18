"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRole } from "@/lib/useRole";

/** Pages de l'interface étudiante : un commerçant est renvoyé vers son espace. */
const STUDENT_PATHS = ["/publier", "/favoris", "/profil", "/onboarding"];

export default function RoleGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useRole(pathname);
  const studentPage = pathname === "/" || STUDENT_PATHS.some((p) => pathname.startsWith(p));
  // /commercant reste ouvert à tous : c'est là qu'on crée son commerce.
  const redirect =
    role === "merchant" && studentPage
      ? "/commercant"
      : role === "student" && pathname.startsWith("/commercant/")
        ? "/commercant"
        : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  // On n'affiche pas l'interface étudiante avant de savoir qui est connecté.
  if (redirect || (role === null && studentPage)) {
    return <p className="p-6 text-center text-sm text-zinc-500">Chargement…</p>;
  }
  return children;
}
