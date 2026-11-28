# ShareWood — le Waze des bons plans étudiants

Comme Waze, mais au lieu de signaler les radars, **les étudiants signalent les bons plans** autour d'eux et disent s'ils sont toujours valables. Projet du hackathon ENSAI (27–28 novembre 2026), zone de démo : Bruz, Ker Lann et Rennes.

**En ligne : https://sharewood-ensai.vercel.app** (compte obligatoire)

## Ce que fait l'application

Pensée pour le **téléphone**, et adaptée à l'**ordinateur** : navigation en haut, carte à côté de la liste, offres en colonnes. À l'ouverture, le logo s'anime pendant le chargement.

### Trouver un bon plan
- **Accueil** : filtres « Pour toi », « Mes favoris » et une puce par catégorie (plusieurs catégories combinables) ; puce **« Plus proches »** : du plus proche au plus loin de sa position (avec accord), sinon de la ville choisie à l'inscription, offres sans lieu à la fin.
- **Recherche** : tolère les fautes, les pluriels et les mots proches ; filtres prix, temps de trajet et conditions ; comprend « gratuit », « pas cher » ou « près de moi ». Toucher une offre de la liste ouvre sa fiche et centre la carte dessus.
- **Carte** : bons plans autour de soi, offres qui marchent en ce moment en premier, boutons + et − pour zoomer ; pendant une recherche, seulement les offres trouvées.
- **Fiche** : détails, photo, lien vers l'offre, boutons « Y aller » (Apple Plans ou Google Maps) et « Partager » (le lien ouvre l'offre après connexion).
- **Partout en France** : à l'inscription, n'importe quelle ville (recherche ou « Me localiser »), plus jusqu'à 4 villes suivies ; la Carte Sortir n'est proposée qu'autour de Rennes.
- **En français ou en anglais** : choix sur la connexion et dans le profil (par défaut, la langue du navigateur) ; les offres restent dans leur langue.
- **Personnalisation** : à l'inscription (localisation, transports, budget, priorités, voyages, bourse, Carte Sortir), modifiable ensuite.
- **Favoris** pour garder une offre sous la main (cœur sur les cartes, dans la fenêtre d'un repère et dans la fiche) ; une offre terminée y reste, marquée « Terminée ».
- **Sources officielles** : événements gratuits ou étudiants (OpenAgenda) et aides aux étudiants (Aides Jeunes), signalés par un badge, avec leur lien et la date de vérification.

### Partager et vérifier
- **Partager en quelques gestes** : le lieu, un titre, une catégorie, et c'est publié (à un endroit précis, dans une ville ou partout) ; le reste est facultatif. Ensuite, « Voir sur la carte » montre l'offre publiée.
- **Photo → formulaire** : l'IA remplit les champs dès que l'offre est prise en photo (ou à partir d'un texte) ; la photo peut servir de preuve (30 analyses par jour et par compte).
- **Doublons** repérés avant la publication : « C'est la même offre » pour la confirmer, « Voir l'offre » pour y aller, ou « Voir mon bon plan » si c'est le sien.
- **Réactions** « J'en ai profité » et « Plus dispo », annulables, impossibles sur ses propres offres.
- **Signaler** une offre depuis sa fiche (arnaque, contenu inapproprié, informations fausses, doublon, autre, avec précisions) : elle disparaît aussitôt pour soi ; l'équipe lit les signalements dans la base (aucun retrait automatique pour les autres).

### Faire confiance
- **Fiabilité façon Waze**, de « Douteux » à « Très fiable » : les avis récents et ceux des étudiants les plus justes et actifs pèsent davantage.
- Au **3e « Plus dispo »**, une offre devient « Douteux » : sans 3 « J'en ai profité » dans les **2 semaines**, elle est retirée ; **6 signalements en 48 h** la retirent tout de suite (sur la carte, le signalement se fait sur place).
- Chaque offre indique si elle vient d'un **commerçant** ou d'un **étudiant**.
- **Aucun accès limité** : tout le monde voit toutes les offres ; ne pas contribuer, c'est seulement ne pas gagner de Flèches.

### Récompenses
- **Les Flèches** : points gagnés en partageant (3 publications récompensées par jour) et en vérifiant, séries de jours, grades Éclaireur, Chasseur de bons plans et Robin des Étudiants.
- **Notifications (appli ouverte)** : « Bons plans à proximité » propose « Tu es près de… : toujours dispo ? » à moins de 150 m d'une offre (position comparée sur le téléphone) ; à l'ouverture, les « J'en ai profité » reçus par ses offres depuis la dernière visite. Réglables dans le profil. Pour la démo, « Simuler ma position » affiche la notification devant l'offre choisie ; la réaction suit les règles habituelles.
- **Sur place** : pour une offre placée sur la carte, il faut partager sa position à moins de 500 m pour gagner des Flèches (publication, réaction) et pour la signaler « Plus dispo » ; une offre sans lieu rapporte bien moins.
- **Page « Ciblés »** : favoris, activité (mes bons plans avec leur audience et leurs Flèches, historique) et boutique de récompenses avec bons à QR code (validés en caisse par le commerçant), tombola (tirage lancé par l'équipe) et **Accès Avant-Première** (voir les offres flash 1 h avant tout le monde).
- **Compétition entre écoles** : chacun choisit son école dans le profil ; la page « Ciblés » classe les écoles par Flèches gagnées sur 7 jours et par membre actif (à partir de 3 membres, seuls des totaux par école sont affichés).
- **Profil** : grade et Flèches, **étudiants aidés** (chacun compte une fois : confirmation, favori, « Y aller » ou lien partagé ouvert) et menu des réglages (préférences, récompenses, historique, informations, sécurité, confidentialité, aide).
- **Parrainage** : code et lien à partager ; +100 Flèches au parrain et +50 au filleul, à la première publication ou réaction du filleul (10 parrainages payés au maximum).

### Espace commerçant
- Publier, modifier et retirer ses offres officielles ; statistiques ; **offre flash** réservée pendant 1 h aux étudiants « Avant-Première ».
- **Mise en avant** payante (9,90 € pour 7 jours) : c'est le modèle économique. Écran de paiement **simulé** (carte de test, aucun débit), reçu numéroté et historique « Mes paiements » dans le compte.
- Retirer les offres d'étudiants périmées près de son commerce.
- **Valider un bon** de la boutique : saisir le code présenté par l'étudiant ; un bon ne sert qu'une fois.

### Compte et confidentialité
- Publications anonymes, changement de mot de passe, export et suppression de ses données, politique de confidentialité.
- **Localisation facultative et sous contrôle** : accord demandé avant tout partage (accepter ou refuser), retirable dans le profil ; envoyée chiffrée et non enregistrée lors d'une réaction ou d'une publication. Sans elle, l'application fonctionne ; sur les offres de la carte, il manque seulement les Flèches et le bouton « Plus dispo ».

## Limites actuelles
- Démonstration : les données de démo mêlent des offres sourcées et des offres **inventées** (signalées « Exemple fictif » dans leur fiche) ; commerçants de démo et partenaires des récompenses sont **fictifs**.
- Le paiement de la mise en avant est **simulé** ; le statut de commerçant n'est pas vérifié.
- Distances et temps de trajet estimés à vol d'oiseau.
- La position vient du navigateur : un utilisateur averti peut la falsifier. L'adresse de contact de la politique de confidentialité est fictive.
- En anglais, seule la politique de confidentialité reste en français.
- Pas encore là : notifications quand l'appli est fermée, rappels de dates limites, filtre « ouvert maintenant ».
- Parrainage et « étudiants aidés » restent gonflables avec de faux comptes (pas de confirmation d'email en démo).

## Technique
Next.js 16 · Tailwind 4 · Supabase (comptes, base Postgres avec droits par ligne, stockage) · Leaflet et OpenFreeMap · icônes Lucide · Gemini ou Claude pour l'assistant · Vercel.

## Installer et lancer
Prérequis : **Node.js 20.9 ou plus** (`node -v`). S'il manque : `brew install node` (macOS), `winget install OpenJS.NodeJS.LTS` (Windows), [nvm](https://github.com/nvm-sh/nvm) (Linux), ou https://nodejs.org. Rouvrir ensuite le terminal.

```
git clone https://github.com/sachabj/hackathon18.git && cd hackathon18
npm install                  # à refaire après un pull qui ajoute une dépendance
cp .env.example .env.local   # remplir les clés Supabase
npm run dev                  # http://localhost:3000
npm run lint && npm run build   # à faire passer avant chaque push
```

La clé `GEMINI_API_KEY` ou `ANTHROPIC_API_KEY` est facultative (assistant de publication) et reste côté serveur. Ne jamais committer `.env.local`.

### Base de données
Dans Supabase → SQL Editor :
- **projet neuf** : exécuter [`supabase/schema.sql`](supabase/schema.sql) ;
- **base existante** : exécuter dans l'ordre les fichiers de [`supabase/migrations/`](supabase/migrations/) pas encore appliqués (état et requête de contrôle dans [`memory/ARCHITECTURE.md`](memory/ARCHITECTURE.md), « Vérifications, base et limites ») ;
- **limites** : la migration `025` borne les titres et l'assistant IA ; la `026` donne le même gain aux deux réactions ; la `028` ajoute le classement des écoles ; la `030` fait valider les bons par le commerçant ; la `031` enregistre les paiements de mise en avant ; la `032` ajoute le tirage de la tombola (`select * from public.draw_raffle();`) et les offres flash ;
- **données de démo** : [`reset_demo.sql`](supabase/reset_demo.sql) (⚠️ **supprime les comptes** non listés en haut du script ; lire ses consignes), puis [`seed_arrows.sql`](supabase/seed_arrows.sql) le jour de la démo ;
- **vraies informations** : migration `024`, puis [`import_sources.sql`](supabase/import_sources.sql) (régénéré par `node scripts/import_sources.mjs` ; à relancer après `reset_demo.sql`), puis [`import_burgerking.sql`](supabase/import_burgerking.sql) (offre vérifiée à la main).

**Remettre la démo à zéro en une fois** : `node scripts/build_demo_sql.mjs` réunit ces scripts, plus [`reduce_demo.sql`](supabase/reduce_demo.sql) (ne garde qu'une quarantaine d'offres inventées), dans `supabase/demo_complet.local.sql` (non versionné), à coller dans le SQL Editor. Il faut une copie `supabase/reset_demo.local.sql` de `reset_demo.sql` avec les comptes à garder et le mot de passe remplis. Aucune migration n'est à relancer.

Pour la démo, désactiver « Confirm email » (Authentication → Sign In / Providers → Email).

### Mise en ligne
À la demande seulement (le déploiement au push est coupé par `vercel.json`, pour préserver le quota Vercel) : on teste en local, puis on déploie sur https://sharewood-ensai.vercel.app en suivant [la procédure](memory/ARCHITECTURE.md). Les variables d'environnement se règlent sur Vercel ; après un changement, redéployer.

## Pour en savoir plus
- **[Vidéo de démo (59 s, sans son)](https://youtube.com/shorts/NvxBMh5c1zU)** et [diapos du pitch (LaTeX)](pitch/) ; données d'exemple
- [Algorithmes de classement et de fiabilité](docs/ALGORITHMES.md)
- [Architecture et conventions](memory/ARCHITECTURE.md)
- [Vision, décisions et tâches](memory/)
- Travail avec Claude Code : lancer `claude` dans le dossier, il lit `CLAUDE.md` et la mémoire.
