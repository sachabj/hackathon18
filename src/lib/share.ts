// Partager ou copier un lien (offre, parrainage). Responsable : Sacha.

/** Copie un texte ; false si le navigateur le refuse (le lien reste alors à copier à la main). */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Feuille de partage du téléphone si elle existe, sinon copie du lien. À appeler directement au clic. */
export async function shareOrCopy(data: { title: string; text: string; url: string }) {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return "shared" as const;
    } catch (e) {
      // Feuille refermée par l'utilisateur : rien à faire. Autre échec : on copie.
      if ((e as Error).name === "AbortError") return "cancelled" as const;
    }
  }
  return (await copyText(data.url)) ? ("copied" as const) : ("failed" as const);
}
