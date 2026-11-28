# ShareWood — le Waze des bons plans étudiants

Comme Waze, mais au lieu de signaler les radars, **les étudiants signalent les bons plans** autour d'eux et disent s'ils sont toujours valables. Projet du hackathon ENSAI (27–28 novembre 2026), zone de démo : Bruz, Ker Lann et Rennes.

**En ligne : https://sharewood-ensai.vercel.app** (compte obligatoire)

## Ce que fait l'application

Pensée pour le **téléphone**, et adaptée à l'**ordinateur** : navigation en haut, carte à côté de la liste, offres en colonnes.

### Trouver un bon plan
- **Accueil** : filtres « Pour toi », « Mes favoris » et une puce par catégorie (plusieurs catégories combinables).
- **Recherche** : tolère les fautes, les pluriels et les mots proches ; filtres prix, temps de trajet et conditions ; comprend « gratuit », « pas cher » ou « près de moi ».
- **Carte** : bons plans autour de soi, offres qui marchent en ce moment en premier, boutons + et − pour zoomer.
- **Fiche** : détails, photo, lien vers l'offre et bouton « Y aller » (Apple Plans ou Google Maps).
- **Personnalisation** : à l'inscription (localisation, transports, budget, priorités, voyages, bourse, Carte Sortir), modifiable ensuite.
- **Favoris** pour garder une offre sous la main.

### Partager et vérifier
- **Partager en quelques gestes** : le lieu, un titre, une catégorie, et c'est publié (à un endroit précis, dans une ville ou partout) ; le reste est facultatif.
- **Photo → formulaire** : l'IA remplit les champs dès que l'offre est prise en photo (ou à partir d'un texte) ; la photo peut servir de preuve.
- **Doublons** repérés avant la publication.
- **Réactions** « J'en ai profité » et « Plus dispo », annulables, impossibles sur ses propres offres.

### Faire confiance
- **Fiabilité façon Waze**, de « Douteux » à « Très fiable » : les avis récents et ceux des étudiants les plus justes et actifs pèsent davantage.
- Une offre signalée « Plus dispo » par **3 étudiants** est archivée (sur la carte, le signalement se fait sur place).
- Chaque offre indique si elle vient d'un **commerçant** ou d'un **étudiant**.
- **Aucun accès limité** : tout le monde voit toutes les offres ; ne pas contribuer, c'est seulement ne pas gagner de Flèches.

### Récompenses
- **Les Flèches** : points gagnés en partageant (3 publications récompensées par jour) et en vérifiant, séries de jours, grades Éclaireur, Chasseur de bons plans et Robin des Étudiants.
- **Sur place** : pour une offre placée sur la carte, il faut partager sa position à moins de 500 m pour gagner des Flèches (publication, réaction) et pour la signaler « Plus dispo » ; une offre sans lieu rapporte bien moins.
- **Page « Ciblés »** : favoris, activité (mes bons plans avec leur audience et leurs Flèches, historique) et boutique de récompenses avec bons à QR code.
- **Profil** : pseudo modifiable, préférences et localisation.

### Espace commerçant
- Publier, modifier et retirer ses offres officielles ; statistiques.
- **Mise en avant** payante (9,90 € pour 7 jours) : c'est le modèle économique.
- Retirer les offres d'étudiants périmées près de son commerce.

### Compte et confidentialité
- Publications anonymes, changement de mot de passe, export et suppression de ses données, politique de confidentialité.
- **Localisation facultative et sous contrôle** : accord demandé avant tout partage (accepter ou refuser), retirable dans le profil ; envoyée chiffrée et non enregistrée lors d'une réaction ou d'une publication. Sans elle, l'application fonctionne ; sur les offres de la carte, il manque seulement les Flèches et le bouton « Plus dispo ».

## Limites actuelles
- Démonstration : les données de démo mêlent des offres sourcées et des offres **inventées** (signalées « Exemple fictif » dans leur fiche) ; commerçants de démo et partenaires des récompenses sont **fictifs**.
- Le paiement de la mise en avant est **simulé** ; le statut de commerçant n'est pas vérifié.
- Distances et temps de trajet estimés à vol d'oiseau.
- La position vient du navigateur : un utilisateur averti peut la falsifier. L'adresse de contact de la politique de confidentialité est fictive.
- Pas encore là : notifications sur place, rappels de dates limites, filtre « ouvert maintenant ».

## Technique
Next.js 16 · Tailwind 4 · Supabase (comptes, base Postgres avec droits par ligne, stockage) · Leaflet et OpenFreeMap · Gemini ou Claude pour l'assistant · Vercel.

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
- **base existante** : exécuter dans l'ordre les fichiers de [`supabase/migrations/`](supabase/migrations/) pas encore appliqués (suivi dans [`memory/TASKS.md`](memory/TASKS.md)) ;
- **données de démo** : [`reset_demo.sql`](supabase/reset_demo.sql) (⚠️ **supprime les comptes** non listés en haut du script ; lire ses consignes), puis [`seed_arrows.sql`](supabase/seed_arrows.sql) le jour de la démo.

Pour la démo, désactiver « Confirm email » (Authentication → Sign In / Providers → Email).

### Mise en ligne
À la demande seulement (le déploiement au push est coupé par `vercel.json`, pour préserver le quota Vercel) : on teste en local, puis on déploie sur https://sharewood-ensai.vercel.app en suivant [la procédure](memory/ARCHITECTURE.md). Les variables d'environnement se règlent sur Vercel ; après un changement, redéployer.

## Pour en savoir plus
- [Diapos du pitch (LaTeX)](pitch/)
- [Algorithmes de classement et de fiabilité](docs/ALGORITHMES.md)
- [Architecture et conventions](memory/ARCHITECTURE.md)
- [Vision, décisions et tâches](memory/)
- Travail avec Claude Code : lancer `claude` dans le dossier, il lit `CLAUDE.md` et la mémoire.
