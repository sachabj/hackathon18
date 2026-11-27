// Politique de confidentialité (accessible sans compte). Responsable : Sacha.
// ⚠️ Elle doit décrire ce que fait réellement le code : la mettre à jour avec toute nouvelle donnée ou service.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { APP_NAME, PRIVACY_CONTACT, NEARBY_M } from "@/lib/constants";

export const metadata: Metadata = { title: `Confidentialité — ${APP_NAME}` };

function Block({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-2">
      <h2 className="text-lg">{title}</h2>
      <div className="space-y-2 text-sm text-[var(--color-ink)] [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">{children}</div>
    </section>
  );
}

export default function Page() {
  return (
    <article className="mx-auto w-full max-w-md lg:max-w-2xl space-y-6 px-4 py-6">
      <Link href="/" className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--color-forest)" }}>
        <ArrowLeftIcon className="h-4 w-4" /> Retour à l&apos;application
      </Link>
      <header>
        <h1 className="text-2xl">Politique de confidentialité</h1>
        <p className="text-sm text-[var(--color-muted)]">Version du 28 novembre 2026</p>
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
          <li><strong>Ta localisation</strong>, avec ton accord seulement : détail dans la partie qui suit.</li>
          <li><strong>Ton choix sur la localisation</strong> (accepté ou refusé, date, version du texte) : le respecter et pouvoir le prouver.</li>
          <li><strong>Bons plans publiés</strong>, avec leur lieu et leur photo si tu l&apos;acceptes : les partager.</li>
          <li><strong>Votes, favoris, vues, « J&apos;en ai profité »</strong> : fiabilité des offres, tes favoris et ton niveau d&apos;activité.</li>
          <li><strong>Poids de tes réactions</strong>, calculé à partir de l&apos;ancienneté de ton compte, de ton activité sur 30 jours et de l&apos;accord de tes réactions avec celles des autres : rendre la fiabilité des offres plus juste. Il n&apos;est ni enregistré ni affiché.</li>
          <li><strong>Tes Flèches</strong> (gains, offre concernée, date) et les jours où tu as partagé ou réagi : ton solde, ton grade et ta série. Toi seul les vois.</li>
          <li><strong>Tes échanges de récompenses</strong> (récompense, code du bon, dates d&apos;échange et d&apos;utilisation) et tes avantages actifs : te redonner tes bons. Rien n&apos;est transmis aux partenaires, tu leur montres toi-même ton bon.</li>
          <li><strong>Pour un commerçant</strong> : nom, adresse, activité et emplacement du commerce.</li>
        </ul>
        <p>
          La base légale est le fonctionnement du service que tu demandes (article 6.1.b du RGPD), et ton accord pour
          la localisation et la publication d&apos;une photo (article 6.1.a).
        </p>
      </Block>

      <Block id="localisation" title="Ta localisation">
        <p>
          <strong>Rien n&apos;est demandé sans ton accord.</strong> La première fois, une fenêtre t&apos;explique
          l&apos;usage : tu acceptes ou tu refuses. Ton navigateur te demande ensuite sa propre autorisation.
        </p>
        <ul>
          <li><strong>Réaction ou publication sur une offre placée</strong> : ta position, arrondie à environ 10 m, est comparée au lieu de l&apos;offre pour vérifier que tu es à moins de {NEARBY_M} m et verser les Flèches. Nous ne l&apos;enregistrons pas. Le gain enregistré, que toi seul vois, indique donc que tu étais près de cette offre à cette date.</li>
          <li><strong>« Plus dispo » sur une offre placée</strong> : accepté seulement à moins de {NEARBY_M} m, avec le même contrôle. Le signalement enregistré indique donc que tu étais près de l&apos;offre ; comme tout vote, il porte un identifiant technique, sans ton nom.</li>
          <li><strong>Carte</strong> : ta position est suivie tant que la carte est ouverte et reste sur ton appareil. Le fournisseur du fond de carte reçoit la zone affichée.</li>
          <li><strong>« Me localiser » (préférences)</strong> : une position arrondie à environ 100 m est enregistrée pour calculer les distances. Toi seul peux la lire.</li>
          <li><strong>« Utiliser ma position » pour placer une offre ou un commerce</strong> : ce point précis devient son lieu public.</li>
        </ul>
        <p>
          <strong>Sécurité</strong> : la position voyage chiffrée (HTTPS) et la base n&apos;autorise chacun à lire que sa
          propre position enregistrée. Elle n&apos;est ni vendue ni utilisée pour de la publicité.
        </p>
        <p>
          <strong>C&apos;est facultatif.</strong> Sans elle, l&apos;application fonctionne ; seuls les Flèches et le
          signalement « Plus dispo » des offres placées sur la carte demandent d&apos;être localisé. Tu retires ton accord à tout moment dans Profil, « Ma localisation »
          (commerçant : « Compte et confidentialité ») : plus rien n&apos;est demandé et la position enregistrée est
          effacée. Un lieu déjà publié le reste tant que l&apos;offre existe. Tu peux aussi bloquer la localisation dans
          les réglages du navigateur.
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
          <li><strong>Google (Gemini) ou Anthropic (Claude)</strong> : seulement dans « Partager », quand tu prends l&apos;offre en photo (envoyée dès que tu la choisis) ou fais analyser un texte : la photo et le texte fournis, pour remplir le formulaire. Rien n&apos;est envoyé à l&apos;IA quand tu publies.</li>
          <li><strong>Photon (komoot)</strong> : le nom du magasin et la ville que tu recherches.</li>
          <li><strong>Apple Plans ou Google Maps</strong> : seulement si tu touches « Y aller » sur une offre ; son emplacement leur est transmis et leur propre politique s&apos;applique.</li>
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
          <li>Retirer un accord (sans effet sur ce qui a été fait avant), t&apos;opposer à un traitement ou demander sa limitation.</li>
          <li>Saisir la CNIL (cnil.fr) si tu estimes que tes droits ne sont pas respectés.</li>
        </ul>
        <p>
          Ces actions se trouvent dans « Compte et confidentialité », depuis ton profil (la localisation, directement
          dans le profil).{PRIVACY_CONTACT && ` Pour toute autre demande : ${PRIVACY_CONTACT}. Réponse sous un mois.`}
        </p>
        <p>Le service est réservé aux personnes d&apos;au moins 15 ans.</p>
      </Block>
    </article>
  );
}
