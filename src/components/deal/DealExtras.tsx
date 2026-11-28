"use client";

// Morceaux communs à la carte du fil et à la fiche : texte avec liens, conditions, bouton « Voir l'offre ».
import { ExternalLinkIcon } from "@/components/icons";
import { REQUIREMENTS } from "@/lib/constants";
import { linkHost, safeLink, splitLinks } from "@/lib/links";
import type { DealRequirement } from "@/lib/types";
import { useT } from "@/lib/i18n";

/** Texte dont les URL http(s) sont cliquables (ouvertes dans un nouvel onglet). */
export function LinkedText({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text).map((part, i) =>
        part.href ? (
          <a
            key={i}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            title={part.href}
            className="break-all underline"
            style={{ color: "var(--color-forest)" }}
          >
            {linkHost(part.href)}
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

/** Conditions pour profiter de l'offre (« Carte étudiante », « Carte Sortir »…). */
export function RequirementBadges({ requirements }: { requirements?: DealRequirement[] | null }) {
  const t = useT();
  const list = (requirements ?? []).filter((r) => r in REQUIREMENTS);
  if (list.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={t("Conditions")}>
      {list.map((r) => {
        const { label, Icon } = REQUIREMENTS[r];
        return (
          <li
            key={r}
            className="sw-badge flex items-center gap-1"
            style={{ backgroundColor: "var(--color-paper)", color: "var(--color-ink)", border: "1px solid var(--color-border)" }}
          >
            <Icon className="h-3.5 w-3.5" /> {t(label)}
          </li>
        );
      })}
    </ul>
  );
}

/** Bouton vers le site de l'offre (lien partagé par l'étudiant). Rien si le lien est absent ou non sûr. */
export function OfferLink({ href, large = false }: { href?: string | null; large?: boolean }) {
  const t = useT();
  const url = safeLink(href);
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={large ? "sw-btn-secondary w-full" : "inline-flex items-center gap-1.5 text-sm font-medium"}
      style={large ? undefined : { color: "var(--color-forest)" }}
    >
      <ExternalLinkIcon className="h-4 w-4" />
      <span className="truncate">
        {t("Voir l'offre")} <span className="font-normal opacity-80">· {linkHost(url)}</span>
      </span>
    </a>
  );
}
