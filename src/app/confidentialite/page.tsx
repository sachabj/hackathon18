// Politique de confidentialité (accessible sans compte). Responsable : Sacha.
// ⚠️ Elle doit décrire ce que fait réellement le code : la mettre à jour avec toute nouvelle donnée ou service.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { APP_NAME, PRIVACY_CONTACT } from "@/lib/constants";

export const metadata: Metadata = { title: `Confidentialité — ${APP_NAME}` };

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg">{title}</h2>
      <div className="space-y-2 text-sm text-[var(--color-ink)] [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">{children}</div>
    </section>
  );
}

export default function Page() {
  return (
    <article className="mx-auto w-full max-w-md space-y-6 px-4 py-6">
      <Link href="/" className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--color-forest)" }}>
        <ArrowLeftIcon className="h-4 w-4" /> Retour à l&apos;application
      </Link>
      <header>
        <h1 className="text-2xl">Politique de confidentialité</h1>
        <p className="text-sm text-[var(--color-muted)]">Version du 27 novembre 2026</p>
      </header>

      <Block title="Qui est responsable ?">
        <p>
          {APP_NAME} est un projet étudiant réalisé pendant un hackathon à l&apos;ENSAI. Son équipe est responsable
          des données décrites ici.{PRIVACY_CONTACT && ` Contact : ${PRIVACY_CONTACT}.`}
        </p>
      </Block>

      <Block title="Les données gardées et leur raison">
        <ul>
          <li><strong>Email et mot de passe</strong> (le mot de passe est stocké haché par notre hébergeur) : te connecter.</li>
          <li><strong>Pseudo, zones, centres d&apos;intérêt, transports, voyages, budget</strong> : personnaliser tes bons plans.</li>
          <li><strong>Boursier et Carte Sortir (oui / non)</strong>, facultatifs : te proposer seulement les aides auxquelles tu as droit.</li>
          <li><strong>Position approximative (~100 m)</strong>, seulement si tu touches « Me localiser » : calculer les distances. La carte, elle, suit ta position sans l&apos;enregistrer.</li>
          <li><strong>Bons plans publiés</strong>, avec leur lieu et leur photo si tu l&apos;acceptes : les partager. Avec « Utiliser ma position actuelle », le lieu publié est ta position précise.</li>
          <li><strong>Votes, favoris, vues, « J&apos;y suis allé », date de ta dernière contribution</strong> : fiabilité des offres, tes favoris, ton accès et ton niveau.</li>
          <li><strong>Pour un commerçant</strong> : nom, adresse, activité et emplacement du commerce.</li>
        </ul>
        <p>
          La base légale est le fonctionnement du service que tu demandes, et ton accord pour la position et la
          publication d&apos;une photo.
        </p>
      </Block>

      <Block title="Ce que les autres voient">
        <ul>
          <li>Les publications sont anonymes : ni ton pseudo ni ton email ne sont montrés aux autres utilisateurs.</li>
          <li>Tes préférences, ton budget, tes réponses sur les aides, ta position et tes favoris ne sont lisibles que par toi.</li>
          <li>Tes bons plans et tes votes portent un identifiant technique, sans ton nom.</li>
          <li>L&apos;application montre à l&apos;auteur d&apos;un bon plan seulement des totaux (vues, passages, favoris, votes).</li>
          <li>Une photo publiée est accessible à toute personne qui a son lien.</li>
          <li>La fiche d&apos;un commerce est visible par les utilisateurs connectés.</li>
        </ul>
      </Block>

      <Block title="Les services extérieurs">
        <ul>
          <li><strong>Supabase</strong> : comptes, base de données et photos.</li>
          <li><strong>Vercel</strong> : hébergement du site. Comme Supabase, il peut garder des journaux techniques (dont l&apos;adresse IP).</li>
          <li><strong>Google (Gemini) ou Anthropic (Claude)</strong> : seulement si tu utilises « Pré-remplir avec l&apos;IA » : la photo et le texte fournis, pour remplir le formulaire. Rien n&apos;est envoyé à l&apos;IA quand tu publies.</li>
          <li><strong>Photon (komoot)</strong> : le nom du magasin et la ville que tu recherches.</li>
          <li><strong>OpenFreeMap et OpenStreetMap</strong> : fournissent le fond de carte et reçoivent à cette occasion ton adresse IP.</li>
        </ul>
        <p>Ces prestataires peuvent traiter des données hors de l&apos;Union européenne. Nous ne vendons pas tes données.</p>
        <p>L&apos;application n&apos;accède pas à ta galerie : elle ne reçoit que la photo que tu choisis.</p>
      </Block>

      <Block title="Combien de temps ?">
        <p>
          Tant que ton compte existe. À sa suppression, tes données sont effacées. Seuls tes bons plans encore actifs
          et confirmés par d&apos;autres étudiants sont conservés, sans lien avec ton compte, avec leur photo
          publiée. Les offres officielles d&apos;un commerce sont effacées avec son compte.
        </p>
      </Block>

      <Block title="Cookies et stockage sur ton appareil">
        <p>
          Un cookie garde ta connexion, et ton navigateur mémorise quelques réglages d&apos;affichage (catégories
          repliées dans les favoris). Aucun cookie publicitaire ni outil de mesure d&apos;audience externe.
        </p>
      </Block>

      <Block title="Tes droits">
        <ul>
          <li>Consulter et télécharger tes données, corriger ton pseudo et tes préférences, effacer ta position.</li>
          <li>Supprimer ton compte à tout moment.</li>
          <li>Retirer un accord, ou t&apos;opposer à un traitement.</li>
          <li>Saisir la CNIL (cnil.fr) si tu estimes que tes droits ne sont pas respectés.</li>
        </ul>
        <p>Ces actions se trouvent dans « Compte et confidentialité », depuis ton profil.</p>
        <p>Le service est réservé aux personnes d&apos;au moins 15 ans.</p>
      </Block>
    </article>
  );
}
