# JOURNAL — historique des requêtes (ajout uniquement, plus récent en bas)

Format : `### AAAA-MM-JJ HHhMM — Prénom` puis puces : ce qui a été fait, fichiers touchés.

### 2026-11-27 ~11h00 — setup initial
- Création du système de mémoire : `CLAUDE.md`, `memory/*.md`, hook `.claude/settings.json`.
- Idée consignée dans `PROJECT.md` (Waze des bons plans étudiants : restaurants, magasins, transport).
- Stack proposée (non validée) dans `ARCHITECTURE.md`.

### 2026-11-27 ~11h30 — Justin
- Dossier lié au repo GitHub `sachabj/hackathon18` (branche `main`, historique distant conservé).
- `.gitignore` complété (Node/Next/.env), `README.md` réécrit.
- `CLAUDE.md` : nouvelle section Git → Claude commit + push automatiquement après chaque requête.
- Mémoire mise à jour : `DECISIONS.md`, `ARCHITECTURE.md`.

### 2026-11-27 ~12h00 — Justin
- Brief détaillé du projet intégré dans `PROJECT.md` : 7 catégories, préférences (catégories + zones Bruz / Ker Lann), système de récompenses, piste commerçants.
- 8 propositions de Claude ajoutées dans `PROJECT.md` (à valider).
- `ARCHITECTURE.md` : modèle de données révisé (zones, scope local/zone/national, profiles.last_active_at) + contrainte sur la géolocalisation web.
- `TASKS.md` : liste des tâches refaite (14 tâches).

### 2026-11-27 ~12h30 — Justin
- Propositions tranchées par l'équipe → `PROJECT.md` réécrit (nom **Waze-Etu**, 8 fonctionnalités validées, Asso refusé).
- Stack validée ; modèle de données complété (favorites, role merchant, last_contribution_at) + règles métier dans `ARCHITECTURE.md`.
- Équipe renseignée + répartition proposée dans `TASKS.md`.
- Hook mémoire modifié : il affiche la liste des .md à lire au lieu de leur contenu (au-delà de ~10 Ko, la sortie d'un hook est tronquée).

### 2026-11-27 ~13h00 — Justin
- Décisions : compte obligatoire pour tout, 24 h de retard pour les inactifs, répartition validée → `PROJECT.md`, `DECISIONS.md`, `TASKS.md`.
- Démarrage du squelette Next.js (tâche 3). BDD en attente des clés Supabase.

### 2026-11-27 ~14h00 — Justin
- Squelette Next.js 16 + Tailwind installé à la racine ; dépendances Supabase + Leaflet.
- `src/proxy.ts` (compte obligatoire), page `/login` (inscription / connexion), NavBar, pages vides avec responsable pour chacun.
- `src/lib/` : client Supabase, types, constantes (catégories, zones), règles métier (fiabilité, accès 7 j, niveaux).
- `supabase/schema.sql` : tables, triggers, RLS (retard 24 h des inactifs), vue `user_contributions`.
- `npm run build` + `npm run lint` OK. `ARCHITECTURE.md` réécrit (arborescence, conventions, BDD).

### 2026-11-27 ~14h30 — Justin
- 7 jours offerts à l'inscription validés. Clés Supabase reçues → `.env.local` (non versionné).
- Test API : le projet répond mais les tables n'existent pas → schéma à exécuter dans le SQL Editor.

### 2026-11-27 ~15h00 — Justin
- Schéma exécuté par l'équipe. Test e2e : inscription OK, mais « permission denied » sur toutes les tables → pas de GRANT par défaut pour `authenticated`.
- Ajout de `supabase/migrations/002_grants.sql` (et des GRANT en fin de `schema.sql`) + convention migrations dans `ARCHITECTURE.md`.
- Un compte de test `test.claude.<timestamp>@gmail.com` a été créé dans Supabase (à supprimer dans Authentication → Users).

### 2026-11-27 — Justin (test BDD)
- `002_grants.sql` appliquée. Test e2e OK : inscription, profil auto, préférences, publication, vote / re-vote, favoris privés, vue, RPC, retard 24 h des inactifs.
- Failles trouvées (accès par colonne) : rôle commerçant auto-attribuable, `is_official` modifiable, bon plan antidatable, `last_contribution_at` modifiable → `003_column_grants.sql` écrite (à exécuter).
- 2 nouveaux comptes `test.claude.a/b.*@gmail.com` créés (à supprimer dans Authentication → Users) ; bons plans de test supprimés.

### 2026-11-27 — Justin (BDD finalisée)
- `003_column_grants.sql` appliquée, test e2e relancé : les 4 failles sont fermées → tâche 4 FAIT.
- Build + lint OK ; en local (`next start`), les pages protégées redirigent vers `/login`.
- Prochaine étape : import Vercel par le propriétaire du repo (procédure dans `ARCHITECTURE.md`).

### 2026-11-27 — Justin (build cassé chez Sacha)
- Cause : la règle `lib/` du `.gitignore` (modèle Python de GitHub) excluait `src/lib/` : client Supabase, types, constantes et règles n'avaient jamais été poussés (commit f3cd327). Le build passait en local seulement.
- Correctif : règles ancrées à la racine (`/lib/`…), `src/lib/` ajouté au repo, vérifié par build sur un clone neuf.

### 2026-11-27 — Justin (npm introuvable chez Sacha)
- Node.js n'est pas installé sur sa machine → prérequis et commandes d'installation ajoutés dans `README.md`.

### 2026-11-27 — Justin (déploiement)
- Sacha lance l'app en local (écran de connexion OK). Procédure d'import Vercel transmise ; en attente de l'URL publique.

### 2026-11-27 — Justin (mise en ligne)
- Site déployé sur https://hackathon18-t1lb.vercel.app. Bandeau Supabase au premier essai ; vérifié ensuite : plus de bandeau, clés présentes dans le build, `/` redirige vers `/login` → tâche 3 FAIT.

### 2026-11-27 14h20 — Justin (carte + écran d'accueil)
- Carte Leaflet de Bruz / Ker Lann (`src/components/map/`) : zones, boutons de recentrage, marqueurs par catégorie, fiches.
- `src/lib/useDeals.ts` + nouvel écran d'accueil `src/app/page.tsx` (en-tête, carte, emplacement du fil pour Sacha).
- Coordonnées des zones vérifiées sur OpenStreetMap (aucune migration).
- Build + lint OK ; carte et fiches testées en local avec des données fictives temporaires (retirées). Lecture réelle depuis Supabase non testée avec un compte connecté.

### 2026-11-27 14h22 — Justin (question déploiement)
- Redéploiement manuel inutile : Vercel redéploie à chaque push sur `main` (déploiement de `ceb8439` vérifié : réussi). Seule exception : changement de variable d’environnement.

### 2026-11-27 — Sacha (préférences, cadrage)
- Tâche 9 reprise à Matteo (avec son accord) → `TASKS.md` : EN COURS (Sacha).
- Choix : localisation par zones + GPS, budget en 3 profils, périmètre = parcours + fil « Pour toi ».

### 2026-11-27 14h27 — Justin (géolocalisation)
- Nouveau hook `src/lib/useUserPosition.ts` ; `DealsMap.tsx` : point bleu + cercle de précision, centrage automatique, bouton « 📍 Autour de moi », message si refus.
- Lint + build OK ; testé dans Chrome sans interface avec position simulée (autorisée et refusée). Pas encore testé sur un téléphone.

### 2026-11-27 — Anne-Lise (renommage)
- Projet renommé **Waze-Etu → ShareWood** : `package.json` (+ `package-lock.json` régénéré via `npm install`), titre de la page (`src/app/layout.tsx`), `APP_NAME` (`src/lib/constants.ts`), `README.md`.
- Mémoire mise à jour : `PROJECT.md`, `TASKS.md`, `DECISIONS.md`.
- Build (`npm run build`) OK après renommage.

### 2026-11-27 — Sacha (préférences + fil « Pour toi »)
- Parcours `/onboarding` (`src/components/preferences/`), score (`src/lib/matching.ts`), accueil avec onglets « Pour toi » / « Tout », filtres et cartes (`src/app/page.tsx`, `src/components/feed/`).
- BDD : `004_preferences.sql` (+ `schema.sql`) **à exécuter** ; exemples fictifs `supabase/seed_demo.sql`.
- `DealsMap.tsx` : correction d'un plantage au retour sur l'accueil, fusion avec la géolocalisation de Justin, vue par défaut sur la zone de l'étudiant.
- Vérifié : lint + build ; SQL et RLS sur un Postgres local (PGlite) ; parcours dans Chrome sans interface avec un faux Supabase, GPS autorisé et refusé. **Pas testé sur la vraie base ni sur téléphone.**

### 2026-11-27 14h34 — Justin (habillage de la carte)
- `BaseMap.tsx` (nouveau), `DealsMap.tsx`, `globals.css`. Fusion avec le travail de Sacha : son `page.tsx` et sa logique de carte (zone par défaut, Rennes, démontage de la page cachée) sont conservés. Nouvelles dépendances : faire `npm install` après le pull.
- Lint + build OK, `npm audit` : 0 faille ; testé sur une version de production en local avec données fictives temporaires (retirées). Pas testé sur un vrai téléphone.

### 2026-11-27 14h40 — Justin (lancer seed_demo)
- Procédure expliquée (SQL Editor). ⚠️ L’auteur des exemples est le plus ancien profil : supprimer les comptes `test.claude.*` AVANT de lancer `seed_demo.sql` (sinon leur suppression efface les exemples).
- La table `preferences` répond côté API (migration 004 apparemment appliquée) ; seed pas encore confirmé.

### 2026-11-27 — Matteo (synchro)
- `git pull --rebase` (87e397d → 76aa69e) + `npm install` (0 faille). Aucun code modifié.

### 2026-11-27 — Matteo (idée : publication par photo)
- Relecture d'un prompt d'extraction (photo d'affiche en magasin → champs du bon plan). Aucun code écrit ; à discuter avec Anne-Lise (tâche 6) avant intégration.

### 2026-11-27 — Justin (espace commerçant, démarrage)
- Tâche 13 prise ; tâche 6 (formulaire de publication) attribuée à Matteo (info Justin).

### 2026-11-27 14h57 — Justin (espace commerçant)
- `/commercant`, `supabase/migrations/005_merchant.sql` (+ `schema.sql`), `src/lib/merchant.ts`, `components/merchant/`, inscription, NavBar, carte, fil (badge « Sponsorisé »).
- Vérifié : lint + build ; migration et droits sur un Postgres local (PGlite, 27 contrôles) ; parcours dans Chrome sans interface avec un faux Supabase. **Migration pas encore lancée sur la vraie base.**

### 2026-11-27 15h — Matteo (formulaire de publication, tâche 6)
- `src/app/publier/page.tsx`, nouveaux `src/components/publish/PublishForm.tsx` et `src/lib/places.ts`. Champs : portée (lieu / zone / partout), magasin + ville → lieu exact (Photon), titre, catégorie (+ sous-catégorie transport), prix + niveau de prix, conditions, activités (`tags`), fin de l'offre, date limite (bourses, sport, Carte Sortir, transports). Pas de migration.
- Vérifié : lint + build ; test bout en bout sur la vraie base avec Playwright (inscription, recherche « Intermarché Bruz », catégorie proposée, publication, relecture des colonnes, puis suppression du bon plan). Compte de test restant : `test.claude.matteo.1795788121989@example.com` (à supprimer dans Supabase si besoin, sans bon plan rattaché). Pas testé sur un vrai téléphone.

### 2026-11-27 15h02 — Justin (déconnexion)
- `components/LogoutButton.tsx`, ajouté à `src/app/profil/page.tsx`. Lint + build OK ; testé dans Chrome sans interface avec un faux Supabase.

### 2026-11-27 15h11 — Sacha (voyages + budget)
- Nouvelle étape « longs trajets » dans le parcours, score voyage, budget non excluant (`matching.ts`, `PreferencesWizard.tsx`, `preferences.ts`, `types.ts`, `constants.ts`, `page.tsx`).
- `006_travel.sql` (+ `schema.sql`) **à exécuter** ; en attendant, le reste du profil s'enregistre mais pas les réponses voyage. 2 exemples ajoutés à `seed_demo.sql`.
- Vérifié : lint + build ; migrations 004 à 006 sur un Postgres local ; 11 contrôles du score ; parcours dans Chrome sans interface avec un faux Supabase. Pas testé sur la vraie base ni sur téléphone.

### 2026-11-27 15h12 — Justin (interface commerçant séparée)
- Pages `/commercant` (offres), `/commercant/statistiques`, `/commercant/compte` ; `RoleGate`, `useRole` (remplace `useIsMerchant`), NavBar et inscription adaptées.
- Lint (1 avertissement connu) + build OK ; testé dans Chrome sans interface avec un faux Supabase, comptes commerçant et étudiant. Pas testé sur la vraie base.

### 2026-11-27 15h12 — Anne-Lise (favoris, tâche 8)
- Bouton cœur (🤍/❤️) sur `DealCard` (props optionnels `favorite` / `onToggleFavorite`), branché sur l'accueil (`src/app/page.tsx`). Nouveau hook `src/lib/useFavorites.ts` (lecture + ajout/retrait optimiste sur la table `favorites`, déjà en place côté BDD).
- `src/app/favoris/page.tsx` reconstruite : liste des bons plans favoris, triée par échéance la plus proche (`deadline_at` puis `expires_at`) pour retrouver facilement une offre qu'on veut regarder plus tard.
- Build cassé après le pull (`maplibre-gl` introuvable) : résolu par `npm install` (nouvelles dépendances de Justin pas encore installées chez moi). `next.config.ts` : `turbopack.root` fixé explicitement (un `package-lock.json` vide dans le dossier parent, hors du repo, faisait choisir la mauvaise racine à Turbopack).
- Vérifié : lint + build OK. **Pas testé dans un navigateur ni contre la vraie base** : aucun outil de navigateur (Chrome, browser intégré) n'était disponible dans cette session, et un script Node ciblant directement la vraie BDD Supabase a été bloqué par le mode automatique (écriture sur une base partagée). Logique relue à la main contre `supabase/schema.sql` (colonnes, policies, GRANT de `favorites` déjà présents, aucune migration nécessaire). À tester sur la vraie base dès que possible.

### 2026-11-27 16h — Matteo (assistant IA de publication)
- Nouveaux `src/app/api/assist/route.ts`, `src/lib/ai/{assist,client,types}.ts`, `src/components/publish/AssistPanel.tsx` ; `PublishForm.tsx` (pré-remplissage, relecture avant publication, panneau doublon / titre) ; dépendance `@anthropic-ai/sdk` ; `.env.example` (`ANTHROPIC_API_KEY`).
- Vérifié : lint + build ; route non connectée → redirigée vers /login ; sans clé → message de repli et publication normale ; Playwright sur la vraie base avec réponses Claude **simulées** (photo → champs + recherche du lieu, relecture indisponible → publié, doublon détecté → confirmé par un vote, titre suggéré appliqué), bons plans de test supprimés. **Appel réel à Claude pas testé (pas de clé sur ce poste).**

### 2026-11-27 15h23 — Sacha (offres immatérielles)
- Besoin précisé : la partie transport vise les réductions SNCF utiles aux étudiants, à classer parmi les offres immatérielles ; homepage prévue par Anne-Lise.
- Proposition notée dans `TASKS.md` (tâche 16, à valider). Aucun code modifié.

### 2026-11-27 16h40 — Anne-Lise (favoris par catégorie + en-tête de marque)
- `src/app/favoris/page.tsx` : les favoris sont désormais regroupés par catégorie (ordre de `CATEGORIES`), triés par échéance dans chaque groupe, pour se repérer facilement quand on en a beaucoup.
- Nom du site plus visible sur `/` et `/favoris` : barre de marque fixe en haut (nom en grand + icône 🪵), le reste du contenu défile dessous. Demande : « que ça fasse plus vrai site, vrai app, que ça fasse sérieux ».
- Pas touché à la carte ni à la structure du fil (zone, onglets, filtres) : la proposition de homepage de Sacha (tâche 16, réductions & aides) reste entière à faire/valider.
- Vérifié : lint + build OK. Pas testé dans un navigateur (toujours indisponible dans cette session).

### 2026-11-27 16h30 — Matteo (Gemini pour l'assistant IA)
- `src/lib/ai/assist.ts` (fournisseur Gemini ou Claude selon la clé, revérification des champs), `src/app/api/assist/route.ts` (erreurs Gemini : quota, clé, modèle), `.env.example` ; dépendance `@google/genai`.
- Vérifié : lint + build. **Appel réel à Gemini pas testé (pas de clé sur ce poste)** ; nom du modèle par défaut repris de la doc du SDK, modifiable via `GEMINI_MODEL`.

### 2026-11-27 15h37 — Justin (règle « poser des questions »)
- `CLAUDE.md` : nouvelle règle (questions avant toute modification). Demande suivante : page Profil (cadrage en cours).

### 2026-11-27 — Justin (profil, démarrage)
- Prises : `/profil` (préférences, mes bons plans, vues / passages / favoris / votes), tâche 10 et boutons de vote (tâche 7). Anne-Lise et Matteo : ne pas démarrer ces deux points en parallèle.

### 2026-11-27 17h — Matteo (test réel de l'assistant avec Gemini)
- Clé Gemini ajoutée par Matteo dans son `.env.local` (pas dans git). `src/lib/ai/assist.ts` : repli automatique entre modèles Gemini, délai de 20 s par essai, modèle par défaut `gemini-3.5-flash` ; `.env.example`.
- Vérifié **en vrai** (Playwright, vraie base, vrai Gemini) avec une affiche générée « Intermarché Bruz -20 % pâtes et riz, jusqu'au 20/12 » : champs bien remplis (titre, prix, conditions, catégorie Grandes surfaces, date, lieu Intermarché retrouvé) en 4,5 à 5,5 s ; relecture en 4,5 à 7,6 s ; doublon détecté au 2e envoi ; titre « SUPER PROMO!!!! 🔥🔥🔥 » → suggestion « Carte Avantage Jeune SNCF : 30 % de réduction ». Bons plans de test supprimés.

### 2026-11-27 17h15 — Anne-Lise (favoris repliables + relookage pro)
- Questions posées (nouvelle règle CLAUDE.md) : portée (toute l'appli), ce qui fait « bébé » (emoji + couleurs/arrondis), mémoriser le repli des catégories (oui, `localStorage`).
- Nouveau `src/components/icons.tsx` (icônes SVG sobres). `NavBar.tsx` et `DealCard.tsx` (fichiers partagés) : emoji remplacés par ces icônes, aucun changement de comportement. `src/app/page.tsx` et `src/app/favoris/page.tsx` : en-tête simplifié (carré bleu + nom, sans emoji), copy sans emoji décoratif, arrondis adoucis (`rounded-lg` au lieu de `rounded-xl`/`-full` sur certains blocs).
- `src/app/favoris/page.tsx` : chaque catégorie est maintenant une section repliable (bouton, chevron qui tourne), état mémorisé dans `localStorage` (clé `sharewood:favoris:collapsed`), lu après montage pour éviter un décalage d'hydratation (`eslint-disable` ciblé sur `react-hooks/set-state-in-effect`, justifié en commentaire).
- Volontairement pas touché : carte, `/commercant`, `/profil`, `/publier`, `/onboarding`, emoji de `TRANSPORT_MODES`/`BUDGET_PROFILES` (voir `TASKS.md` et `DECISIONS.md`).
- Vérifié : lint + build OK. Toujours pas d'outil de navigateur disponible dans cette session pour un test visuel réel.

### 2026-11-27 15h47 — Justin (profil, audience, votes)
- `/profil`, `components/deal/`, `components/profile/`, `lib/engagement.ts`, `007_engagement.sql` (+ `schema.sql`) ; petites modifications de `DealCard`, `DealsMap`, `PreferencesWizard`, `rules.ts`.
- 005 et 006 semblent appliquées (tables / colonnes présentes côté API). **007 à exécuter.**
- Vérifié : lint (1 avertissement connu) + build ; migration sur Postgres local (19 contrôles) ; parcours dans Chrome sans interface avec un faux Supabase. Pas testé sur la vraie base ni sur téléphone.

### 2026-11-27 16h05 — Justin (script de données de démo)
- `supabase/reset_demo.sql` (+ règle `.gitignore` pour la copie locale). Testé sur Postgres local (refus si compte à garder introuvable, relançable). **Pas exécuté sur la vraie base** ; connexion des comptes de démo non vérifiable en local.
- Sources lues en direct : Cinéma Arvor, Grand Logis, Resto U', STAR, musée des Beaux-Arts. Autres (SNCF, TER, Cinéville, Pass'Sport, DSE, repas à 1 €) : résultats de recherche, à revérifier.
- ⚠️ Constat : `.env.example` contient en local une clé `GEMINI_API_KEY` non committée : la déplacer dans `.env.local`.

### 2026-11-27 17h30 — Matteo (photo de preuve)
- Nouveaux `supabase/migrations/008_deal_photos.sql` (+ `schema.sql`), `src/lib/photos.ts` ; modifiés `src/lib/types.ts` (`photo_url`), `PublishForm.tsx` + `AssistPanel.tsx` (photo analysée gardée, aperçu « Photo jointe comme preuve », dépôt à la publication), `src/components/feed/DealCard.tsx` (fichier de Sacha : miniature + photo en grand).
- Avertissement Next « Instant navigation » signalé par Matteo : contrôle de développement seulement, laissé tel quel (son choix).
- Vérifié : lint + build ; test Playwright sur la vraie base **sans la migration 008** : aperçu affiché, publication OK sans photo (« Bucket not found » ignoré), bon plan de test supprimé. **Affichage de la photo dans le fil à tester après la migration 008.**

### 2026-11-27 16h06 — Sacha (profil, état des lieux)
- Relecture de `/profil`, des droits en base et des envois de données externes ; liste des besoins (tâche 17). Aucun code modifié.

### 2026-11-27 17h45 — Matteo (renommage « Partager »)
- « Signaler » → « Partager » pour la publication : `NavBar.tsx`, `PublishForm.tsx`, `src/app/layout.tsx`, et fichiers de Justin `src/app/profil/page.tsx` (lien) et `components/profile/ActivityCard.tsx` (deux phrases). Lint + build OK.
- Offre « -20 % sur les pâtes et le riz » (Intermarché Bruz, publiée par Matteo) : à supprimer par Matteo depuis /profil (seul l'auteur peut supprimer, RLS).

### 2026-11-27 16h10 — Justin (reset_demo assoupli)
- `supabase/reset_demo.sql` (+ copie locale) : adresses absentes ignorées et listées. Retesté sur Postgres local. Toujours **pas exécuté sur la vraie base**.
- La clé Gemini n'est plus dans `.env.example` (présente dans `.env.local`, jamais committée).

### 2026-11-27 16h25 — Sacha (sécurité du compte et confidentialité)
- `/compte`, `/confidentialite`, `components/account/`, `lib/account.ts`, `009_account.sql` (+ `schema.sql`) ; modifiés : `login`, `proxy.ts`, `NavBar`, `PublishForm`, `AssistPanel`, `photos.ts`, `engagement.ts`, `types.ts`, `constants.ts`, `profil`, `commercant/compte`, `reset_demo.sql`.
- Vérifié : lint (1 avertissement connu) + build ; 23 contrôles sur un Postgres local ; 21 contrôles dans Chrome sans interface avec un faux Supabase. **009 pas lancée sur la vraie base**, rien testé sur la vraie base ni sur téléphone.

### 2026-11-27 18h30 — Anne-Lise (refonte visuelle complète « ShareWood »)
- Nouveau système de design appliqué à **toute** l'app, à partir de `DESIGN_SHAREWOOD.md` (style éditorial, calme, sans emoji) : polices Newsreader (titres) + Inter (reste), auto-hébergées en `woff2` dans `public/fonts/` (pas `next/font/google`, pour la même raison que la police système d'avant : build sans réseau sur certains postes) ; palette forêt / aubergine / sauge / lilas / crème en jetons CSS (`@theme inline`, `src/app/globals.css`) ; logo `public/logo.svg` + `src/app/icon.svg` (remplace `favicon.ico`, supprimé).
- Nouveau `src/components/CategoryIcon.tsx` (rond coloré + icône au trait par catégorie, chemins SVG exacts du document) ; `src/components/icons.tsx` passe de 8 à une cinquantaine d'icônes (toutes au trait, sans fond, pour la nav et les boutons).
- Demande explicite d'Anne-Lise allant plus loin que le document : **plus aucun emoji nulle part dans l'app** (remplacés par ces icônes, ou simplement retirés quand le texte est une chaîne brute sans JSX possible — `<option>`, libellés joints, raisons de `matching.ts`).
- Fichiers touchés : à peu près tous les composants et pages (`constants.ts`, `rules.ts`, `offerStats.ts`, `matching.ts`, toute la préférence/profil/commerçant/publication/carte/fil, `page.tsx`, `favoris`, `login`, `confidentialite`, `compte`, `NavBar`, `account/*`, etc.) — changement **uniquement visuel**, aucune logique, donnée, route ni appel Supabase modifié.
- Vérifié : `npx tsc --noEmit`, `npm run lint` et `npm run build` tous OK. Pas d'outil de navigateur disponible dans cette session pour un test visuel réel (comme à chaque fois) : à vérifier en lançant `npm run dev`.

### 2026-11-27 17h15 — Justin (nouvelles modifications, cadrage)
- 10 modifications demandées par l'équipe ajoutées dans `TASKS.md` (tâches 18 à 27, lots A à D, toutes libres) ; `PROJECT.md`, `DECISIONS.md`. Aucun code modifié.

### 2026-11-27 17h16 — Justin (allowScripts)
- `package.json` : autorisation du script d'installation de `protobufjs@7.6.6` (dépendance de `@google/genai`) ajoutée pour npm 11 ; script relu : il affiche seulement un avertissement de version.

### 2026-11-27 17h21 — Justin (relecture du code, TASKS nettoyé)
- Tout le code relu ; `TASKS.md` réécrit (statuts, précisions des tâches 18 à 27, défauts D1 à D9, notes périmées retirées). Ligne des migrations corrigée dans `ARCHITECTURE.md` : 007, 008, 009 présentes sur la base (sondes en lecture avec la clé publique).
- Lint (1 avertissement connu) + build OK. Aucun code modifié ; défauts relevés à la lecture, non reproduits dans l'app.


### 2026-11-27 17h24 — Justin (lots A, B, C pris)
- Tâches 18 à 26 réservées avant de coder (`TASKS.md`).

### 2026-11-27 19h — Matteo (tâche 27 : doublons sans IA)
- Nouveau `src/lib/duplicates.ts` ; `PublishForm.tsx` (liste « Déjà partagé ici » sous le lieu, panneau « Une offre semblable existe peut-être déjà » pour zone / partout, écran « Bon plan validé ») ; relecture IA supprimée de `lib/ai/assist.ts`, `lib/ai/client.ts`, `lib/ai/types.ts`, `api/assist/route.ts` ; `src/app/confidentialite/page.tsx` (fichier de Sacha : mention IA). Code poussé dans `f101495`, mémoire dans le commit suivant.
- Vérifié : tsc + lint + build ; Playwright sur la vraie base (vote et insertion interceptés, rien d'écrit) : Intermarché Bruz → « Déjà partagé ici (1) » puis « C'est la même offre » → « Bon plan validé » ; transport « Partout » → « Carte Avantage Jeune SNCF » proposée, « Non, publier la mienne » → publié ; **0 appel à l'IA**.
- Défaut D1 : corrigé côté app (pas de vote proposé sur son propre bon plan) ; règle en base encore à faire.
- L'ancien compte de test a été effacé (reset_demo) ; nouveau : `test.claude.matteo.1795797148943@example.com` (aucun bon plan, à supprimer si besoin).

### 2026-11-27 17h38 — Justin (tâches 18 à 26)
- Nouveaux `app/page.tsx` (accueil), `app/recherche/page.tsx`, `010_student_aids.sql` ; modifiés : carte, `NavBar`, `RoleGate`, `DealCard`, favoris, parcours d'inscription, `matching`, préférences, confidentialité, `reset_demo.sql`.
- Vérifié : types + lint (1 avertissement connu) + build ; base sur Postgres local (reset_demo avec et sans 010, RLS ; un « échec » attendu du test au 2e passage) ; parcours dans Chrome sans interface avec un faux Supabase, GPS refusé et autorisé. Corrigé au passage : la carte pouvait rester sur la zone au lieu du GPS (zoom animé). **Pas testé sur la vraie base ni sur téléphone.**

### 2026-11-27 17h51 — Justin (défauts D1, D2, D10)
- `011_no_self_vote.sql` (+ `schema.sql`) ; `ChoiceTile.tsx` ; copie locale `reset_demo.local.sql` reconstruite (non versionnée).
- Vérifié : migration sur Postgres local (ancien vote effacé, vote sur le sien refusé, vote sur un autre et sans auteur acceptés) ; tuiles vues dans Chrome sans interface ; types + lint + build. **011 pas lancée sur la vraie base.**

### 2026-11-27 — Justin (badge grandes enseignes)
- Nouveaux `lib/chains.ts`, `components/ChainBadge.tsx` ; badge sur `DealCard`, `DealSheet`, fiche de la carte. Reconnaissance par le nom du lieu (liste), sans migration ni effet sur le tri. Choix par défaut, à confirmer. Branche locale `badge-enseignes`, non poussée.

### 2026-11-27 17h57 — Justin (fusion du badge)
- Branche `badge-enseignes` fusionnée dans `main` ; fenêtre de la carte agrandie (220 px) pour que « Voir et réagir » reste visible.
- Vérifié : types + lint (1 avertissement connu) + build ; Chrome sans interface avec un faux Supabase : badge sur les cartes, la fiche et la carte pour les enseignes, absent ailleurs. Pas testé sur la vraie base ni sur téléphone.

### 2026-11-27 18h00 — Justin (bouton « Y aller »)
- Migrations 010 et 011 exécutées par Justin. Nouveau `src/lib/directions.ts` ; `DealSheet.tsx`, `icons.tsx`, `confidentialite/page.tsx`.
- Vérifié : types + lint (1 avertissement connu) + build ; Chrome sans interface avec un faux Supabase (liens Mac / iPhone / Android / Windows, absent pour une offre nationale). Ouverture réelle de l'application de cartes non testée.

### 2026-11-27 18h00 — Matteo (tâche 28 : Carte Sortir en condition, liens d'offre)
- Nouveaux : `supabase/migrations/012_requirements_links.sql`, `src/lib/links.ts`, `src/lib/legacy.ts`, `src/components/deal/DealExtras.tsx`.
- Modifiés : `types.ts`, `constants.ts` (`REQUIREMENTS`, catégorie retirée), `CategoryIcon.tsx` (+ libellé français par défaut, D6), `icons.tsx` (carte d'identité, billet, lien), `matching.ts`, `useDeals.ts`, `engagement.ts`, `favoris/page.tsx`, `page.tsx`, `DealCard.tsx`, `DealSheet.tsx`, `MyDealCard.tsx` (fichiers de Sacha, Justin, Anne-Lise : ajouts seulement), `PublishForm.tsx`, `lib/ai/{assist,types}.ts`, `schema.sql`, `reset_demo.sql` (fichier de Justin), `seed_demo.sql`, `README.md`, `DESIGN_SHAREWOOD.md`.
- Vérifié : tsc + lint (1 avertissement connu) + build ; liens (vide, `www.`, `javascript:` refusé, ponctuation finale) et « Pour toi » avec condition Carte Sortir (oui / non / sans réponse) testés en script. **Migration 012 pas lancée** ; rien testé dans le navigateur ni sur la vraie base.

### 2026-11-27 18h14 — Justin (badges Commerçant / Étudiant, démo élargie)
- Nouveau `AuthorBadge.tsx` ; supprimés `ChainBadge.tsx`, `lib/chains.ts` ; `DealCard`, `DealSheet`, `DealsMap`, `recherche/page.tsx` ; `reset_demo.sql` régénéré avec des lieux OpenStreetMap (requête publique Overpass), copie locale reconstruite.
- Vérifié : types + lint (1 avertissement connu) + build ; script sur Postgres local avec 010 à 012 (2 passages, 152 bons plans, espace commerçant) ; badges et filtre dans Chrome sans interface avec un faux Supabase. **Script pas lancé sur la vraie base.**

### 2026-11-27 18h25 — Matteo (tâche 29 : réactions décochables)
- Nouveau `supabase/migrations/013_unvote.sql` (+ `schema.sql`). `engagement.ts` : `removeVote`, `setReaction`. `DealSheet.tsx` (fichier de Justin) : deux boutons « J'y suis allé » / « Plus dispo », exclusifs et décochables, aide « Touche à nouveau pour décocher ». Libellés : `MyDealCard` (« Confirmé »), `commercant/statistiques`, `offerStats.ts`, `PROJECT.md`.
- Vérifié : tsc + lint (1 avertissement connu) + build. **013 pas lancée** ; pas testé dans le navigateur ni sur la vraie base.

### 2026-11-27 18h40 — Matteo (tâche 30 : fiabilité en couleurs)
- Nouveau `src/components/deal/TrustBadge.tsx` ; `src/lib/rules.ts` (`TRUST_LEVELS`, `trustLevel`, `trustLevelOf`) ; `DealCard.tsx` et `DealSheet.tsx` (fichiers de Sacha / Justin : badge seulement).
- Vérifié : tsc + lint (1 avertissement connu) + build ; seuils testés en script (0,39 → rouge, 0,4 → jaune, 0,65 → vert clair, 0,85 → vert foncé). Pas testé dans le navigateur.

### 2026-11-27 19h00 — Matteo (tâche 32 : tri Hot)
- Nouveau `src/lib/hot.ts` ; modifiés `src/app/recherche/page.tsx` (fichier de Sacha / Justin : tri de « Tout »), `src/components/feed/DealCard.tsx` (badge « Tendance »), `src/lib/useDeals.ts` (`loadedAt`).
- Vérifié : tsc + lint (1 avertissement connu) + build ; formule testée en script (neuve sans vote 0,27 ; 2 j avec 5 passages récents 0,07 + Tendance ; mêmes passages il y a 40 h 0,05 ; 2 « Plus dispo » négatif). Pas testé dans le navigateur.

### 2026-11-27 19h15 — Sacha (accueil en onglets, tâche 31)
- `src/app/page.tsx` réécrit (recherche + onglets), nouveau `src/lib/search.ts`, `src/app/recherche/page.tsx` (filtres « Pour toi / Tout » et auteur retirés). Fusion avec le tri Hot de Matteo (tâche 32) : conservé sur la liste de Recherche.
- Vérifié : tsc + lint (1 avertissement connu) + build ; Chrome sans interface avec un faux Supabase (onglets, recherche, page carte, tri Hot, badge Tendance, profil non rempli). **Pas testé sur la vraie base ni sur téléphone.**

### 2026-11-27 19h01 — Sacha (onglets rectangulaires)
- `src/app/page.tsx` : les pastilles deviennent une barre de 5 onglets rectangulaires (icône de « Pour toi » retirée).
- Vérifié : tsc + lint (1 avertissement connu) + build ; Chrome sans interface avec un faux Supabase, à 390 et 320 px (une ligne, texte qui tient, clavier). **Pas testé sur la vraie base ni sur téléphone.** Défaut D11 noté (barre du bas à 320 px).

### 2026-11-27 19h45 — Matteo (tâche 33 : fiabilité façon Waze)
- Nouveaux : `supabase/migrations/014_voter_weights.sql` (+ `schema.sql`), `src/lib/trust.ts`, `src/components/profile/InfluenceCard.tsx`.
- Modifiés : `rules.ts` (`voteMasses`, `trustScore`, `reliability`, `dealTrustLevel`, `isDealHidden`, `INFLUENCE_RANKS` ; `trustPercent` / `trustLevelOf` supprimés), `types.ts` (`DealTrust`), `useDeals.ts`, `engagement.ts`, `favoris/page.tsx`, `DealCard.tsx`, `DealSheet.tsx`, `profil/page.tsx`, `confidentialite/page.tsx`.
- Vérifié : tsc + lint (1 avertissement connu) + build ; 014 sur Postgres local (PGlite, relançable ; contradicteur 0,95 contre 1,54 pour les justes, compte neuf 0,67) ; scénarios en script (10 confirmations : 7 j → Fiable, 14 j → À vérifier ; 3 anciennes + 1 « Plus dispo » frais → À vérifier ; 2 « Plus dispo » frais → masqué). **014 pas lancée** ; pas testé dans le navigateur.

### 2026-11-27 19h12 — Sacha (recherche, tâche 34)
- `src/lib/search.ts` réécrit, `src/app/page.tsx` (liste de résultats).
- Vérifié : tsc + lint (1 avertissement connu) + build ; 20 contrôles des règles en script ; essais sur les 151 offres de `reset_demo.sql` (Postgres local), listes de mots resserrées ensuite ; Chrome sans interface avec un faux Supabase. **Pas testé sur la vraie base ni sur téléphone.**

### 2026-11-27 19h15 — Sacha (bouton « Rechercher »)
- `src/app/page.tsx` : barre de recherche en formulaire, bouton « Rechercher », touche du clavier mobile ; texte du champ raccourci. Les résultats restent affichés pendant la saisie (choix de Sacha).
- Vérifié : tsc + lint (1 avertissement connu) + build ; Chrome sans interface avec un faux Supabase (320 et 390 px). **Clavier d'un vrai téléphone pas testé.**

### 2026-11-27 19h19 — Sacha (croix pour annuler la recherche)
- `src/app/page.tsx` : croix au bout du champ dès qu'il contient du texte (remplace la croix native du navigateur). Conflit dans `TASKS.md` avec la prise de la tâche 35 (Matteo) : les deux lignes gardées.
- Vérifié : tsc + lint (1 avertissement connu) + build ; Chrome sans interface avec un faux Supabase. Pas testé sur un téléphone.

### 2026-11-27 20h05 — Matteo (tâche 35 : carte épurée, réactions directes)
- Nouveaux : `components/deal/ReactionBar.tsx`, `components/deal/QuickReactions.tsx`, `lib/useDealReactions.ts`, `lib/useCurrentUserId.ts`.
- Modifiés : `feed/DealCard.tsx` (réécrit), `deal/DealSheet.tsx` (photo, `ReactionBar`, `onReactionsChange`), `map/DealsMap.tsx` (fenêtre : réactions directes, sans « Sponsorisé » ni description), `lib/matching.ts` (`Match.distance`), `lib/rules.ts` (`recentCounts`), `lib/engagement.ts` (`fetchReactions`, `setVisited` en upsert).
- Vérifié : tsc + lint (1 avertissement connu) + build. **Pas vu dans le navigateur** (connexion requise) ni sur téléphone.

### 2026-11-27 19h21 — Sacha (idées pour la recherche)
- Question seulement, aucun code modifié. Constat sur les offres de démo (base locale) : « pizza pas cher », « pizza près de moi », « ciné ce soir » ne donnent aucun résultat (chaque mot est exigé dans l’offre). Pistes proposées à Sacha, à décider.

### 2026-11-27 19h34 — Sacha (filtres de recherche, tâche 36)
- Nouveaux `lib/searchFilters.ts`, `components/feed/SearchFilters.tsx` ; modifiés `app/page.tsx`, `lib/search.ts` (`tokenize` exporté), `lib/matching.ts` (`travelMinutes`). Sans migration.
- Vérifié : tsc + lint (1 avertissement connu) + build ; 17 contrôles des filtres en script (+ essais sur les offres de démo) ; 64 contrôles dans Chrome sans interface avec un faux Supabase, à 390 et 320 px (tests adaptés à la carte de la tâche 35). **Pas testé sur la vraie base ni sur téléphone.**

### 2026-11-27 20h25 — Matteo (tâche 37 : démo et cartes allégées)
- Nouveau `supabase/migrations/015_demo_titles.sql` (données). `reset_demo.sql` (fichier de Justin) : 137 titres sans « [Exemple] », commentaire et contrôle final.
- Montant retiré : `DealCard`, `DealSheet`, `DealsMap`, `commercant/page.tsx`, `OfferCard`, `OfferForm` (champ retiré, ancienne valeur conservée), `MyDealCard` + `MyDealInput`, `PublishForm` (section « Niveau de prix »), consigne de l'IA (`ai/assist.ts`). Flamme retirée (`DealCard`, `isTrending` supprimé de `hot.ts`).
- Vérifié : tsc + lint (1 avertissement connu) + build ; 015 sur PGlite (relançable, mention ajoutée si absente). Pas vu dans le navigateur.

### 2026-11-27 20h35 — Matteo (tâche 38 : ligne du lieu pleine largeur)
- `src/components/feed/DealCard.tsx` : le lieu et la distance quittent la colonne du titre pour une ligne pleine largeur (icône repère) sous la ligne titre / fiabilité / cœur, sans espace vide sous le badge. Choix de Matteo (aperçus proposés avant de coder).
- Vérifié : tsc + lint (1 avertissement connu) + build. Pas vu dans le navigateur.

### 2026-11-27 20h45 — Matteo (tâche 39 : sans « Bonjour »)
- `src/app/page.tsx` et `src/app/recherche/page.tsx` : titre « Bonjour <pseudo> » remplacé par un titre invisible (lecteurs d'écran) ; sur Recherche, le bloc d'en-tête n'est affiché que s'il contient l'invitation à personnaliser ou une erreur.
- Vérifié : tsc + lint (1 avertissement connu) + build. Pas vu dans le navigateur.

### 2026-11-27 20h18 — Sacha (Les Flèches, tâche 17b)
- Nouveaux : `016_arrows.sql` (+ `schema.sql`), `seed_arrows.sql`, `lib/arrows.ts`, `lib/useMyArrows.ts`, `components/arrows/`. Modifiés : `engagement`, `rules`, `useDeals`, `useDealReactions`, `duplicates`, `account`, `offerStats`, `types`, `ReactionBar`, `QuickReactions`, `DealSheet`, `MyDealCard`, `OfferCard`, `PublishForm`, `icons`, `layout`, accueil, recherche, favoris, profil, confidentialité, `globals.css`.
- Vérifié : tsc + lint (1 avertissement connu) + build ; 36 contrôles de la migration et scripts de démo sur Postgres local ; 29 contrôles des Flèches et 63 de régression dans Chrome sans interface avec un faux Supabase. **016 et seed_arrows pas lancés sur la vraie base**, rien testé sur la vraie base ni sur téléphone.

### 2026-11-27 21h00 — Matteo (tâche 40 : document des algorithmes)
- Nouveau `docs/ALGORITHMES.md` (lecteurs : équipe + jury) : offres visibles, ordre par écran, sponsorisées, compatibilité « Pour toi » (barème + exemple), Hot (formule + exemples), recherche (poids, correspondances), fiabilité façon Waze (poids d'un étudiant, masse, score, couleurs, compteurs, archivage à 3 signalements de la tâche 17b, repli sans 014), limites, tableau « où régler ».
- Écrit d'après le code à jour (après la tâche 17b de Sacha). Exemples chiffrés repris des tests en script et sur PGlite des tâches 32 et 33. Aucun code modifié.

### 2026-11-27 20h47 — Sacha (« Ciblés » et récompenses, tâche 42)
- Nouveaux : `017_rewards.sql` (+ `schema.sql`), `lib/rewards.ts`, `components/{Tabs,cibles,rewards}`, `arrows/UseArrowsLink`. Modifiés : `favoris/page.tsx`, accueil (onglets partagés), `NavBar`, `ArrowsCard`, `ArrowBadge`, `InfluenceCard`, profil, `icons`, `arrows.ts`, `account.ts`, confidentialité, `globals.css`, `seed_arrows.sql`, `docs/ALGORITHMES.md` ; dépendance `qrcode`.
- Vérifié : tsc + lint (1 avertissement connu) + build ; 57 contrôles base et scénario de démo sur Postgres local ; 48 + 63 contrôles dans Chrome sans interface avec un faux Supabase. **017 pas lancée**, rien testé sur la vraie base ni sur téléphone.

### 2026-11-27 soir — Justin (récapitulatif du projet)
- Récapitulatif demandé, aucun code modifié. Sonde en lecture seule de la vraie base : 014 et 016 présentes, 017 absente (013, 015 non vérifiables) ; `TASKS.md` annoté. Copie locale `reset_demo.local.sql` de Justin plus ancienne que `reset_demo.sql` (à refaire avant lancement).

### 2026-11-27 soir — Justin (README)
- `README.md` réécrit (fonctions, limites, installation) ; règle de mise à jour ajoutée dans `CLAUDE.md` ; `TASKS.md`, `DECISIONS.md`. Aucun code modifié. Décrit l'application avant la tâche 43 de Sacha (en cours).

### 2026-11-27 21h20 — Sacha (fin de l'accès limité, tâche 43)
- Nouveau `018_no_access_limit.sql` (+ `schema.sql`). Modifiés : `rules.ts`, `ActivityCard`, `ActivityPanel`, `arrows.ts`, `PublishForm`, confidentialité, `types.ts`, `seed_arrows.sql`, `docs/ALGORITHMES.md`.
- Vérifié : tsc + lint (1 avertissement connu) + build ; 67 contrôles base et scénario de démo sur Postgres local ; 50 + 63 contrôles dans Chrome sans interface avec un faux Supabase. **018 pas lancée**, rien testé sur la vraie base ni sur téléphone.

### 2026-11-27 soir — Sacha (README, tâche 43)
- `README.md` : retard de 24 h retiré, plafond de 3 publications récompensées par jour ajouté (demande notée par Justin). Aucun code modifié.

### 2026-11-27 soir — Justin (copie locale de la démo)
- `reset_demo.local.sql` (non versionnée) reconstruite depuis le script à jour, mêmes comptes gardés et mot de passe. Testée sur Postgres local avec le schéma jusqu'à 018 (2 passages, puis `seed_arrows.sql`, 0 échec). **Pas lancée sur la vraie base.**

### 2026-11-27 soir — Anne-Lise (recherche déplacée sur Recherche + surlignage carte)
- Questions posées (CLAUDE.md) avant de coder : contenu restant sur l'Accueil une fois la recherche partie, clic = surligner seul ou aussi ouvrir la fiche, portée du surlignage (partout sur Recherche ou seulement en cherchant), coordination avec Sacha (recherche/onglets) et Justin (carte) qui travaillent sur ces fichiers. Toutes les options recommandées retenues.
- `src/app/page.tsx` (Accueil) : barre de recherche, filtres et calcul des résultats retirés ; ne garde que les onglets « Pour toi » + les 4 rubriques, inchangés sinon.
- `src/app/recherche/page.tsx` : reçoit la barre de recherche + `SearchFilters` (déplacés depuis l'Accueil, logique identique) ; puces de catégorie retirées (gain de place) ; la carte montre toujours toutes les offres localisées, qu'on cherche ou pas ; sous la carte, le fil « Hot » habituel reste affiché quand le champ est vide, remplacé par les résultats de recherche (exacts + proches) pendant une saisie, comme avant sur l'Accueil.
- `src/components/feed/DealCard.tsx` : nouveau prop optionnel `onSelect` — quand il est fourni ET que l'offre a un lieu, toucher la carte sélectionne l'offre (au lieu d'ouvrir sa fiche) ; sans lieu (offre zone/nationale) ou si `onSelect` n'est pas fourni (Accueil, Favoris…), comportement inchangé (ouvre la fiche). Fichier partagé (tâche 35, Matteo) : changement additif et optionnel seulement, aucun effet là où `onSelect` n'est pas passé.
- `src/components/map/DealsMap.tsx` : nouveau prop `selectedId` ; un effet centre la carte (`flyTo`) sur l'offre choisie et la marque avec une icône distincte (contour aubergine, rebond) via `globals.css` (`.wz-pin-selected`) ; prend la main sur le suivi GPS comme un glissé manuel de la carte.
- `npm install` fait (dépendance `qrcode` de la tâche 42 de Sacha, manquante après le pull, sans rapport avec cette demande).
- Vérifié : tsc + lint (1 avertissement connu) + build OK. Pas vu dans le navigateur (toujours indisponible dans cette session) : à tester en lançant `npm run dev`, notamment le surlignage au clic et le repli « ouvre la fiche » pour une offre sans lieu.

### 2026-11-27 21h32 — Sacha (bloc « Grade », tâche 44)
- `ArrowsCard` (bloc Grade, pastille retirée), `InfluenceCard.tsx` supprimé, `rules.ts`, `trust.ts`, `RedeemDialog`, confidentialité, README, `docs/ALGORITHMES.md`.
- Vérifié : tsc + lint (1 avertissement connu) + build ; 54 contrôles dans Chrome sans interface avec un faux Supabase (avant la fusion avec la recherche déplacée d'Anne-Lise, puis relancés). Pas testé sur la vraie base ni sur téléphone.

### 2026-11-27 21h46 — Sacha (profil sans Flèches, tâche 46)
- `profil/page.tsx`, `UseArrowsLink.tsx` supprimé, `019_golden_badge_text.sql` (+ texte dans `017` et `schema.sql`). Numéro de tâche 45 pris en même temps par Justin : le mien passé à 46, les deux lignes gardées.
- Vérifié : tsc + lint (1 avertissement connu) + build ; 68 contrôles base sur Postgres local ; 53 contrôles dans Chrome sans interface avec un faux Supabase. **019 pas lancée**, rien testé sur la vraie base ni sur téléphone.

### 2026-11-27 soir — Justin (« Partager » plus rapide, tâche 45)
- `PublishForm.tsx`, `AssistPanel.tsx`, `confidentialite/page.tsx` (envoi de la photo à l'IA dès son choix), `README.md`, mémoire.
- Vérifié : tsc + lint (1 avertissement connu) + build ; Chrome sans interface avec un faux Supabase, IA et recherche de lieu simulées (publication à la main, photo, détails, lien invalide, réessai, texte, 320 px ; bouton « Publier » visible sans défiler à 390 × 844). **Pas testé sur la vraie base, la vraie IA ni un téléphone.**

### 2026-11-27 soir — Anne-Lise (surlignage dans la liste + étiquette « Sponsorisé »)
- Retour de l'utilisateur sur le changement précédent : le surlignage carte ne se voyait pas dans la liste, et le cadre doré des offres sponsorisées n'était pas compris (« mises en avant sans savoir pourquoi »).
- `src/components/feed/DealCard.tsx` : nouveau prop `selected` (contour aubergine si vrai, même couleur que le repère choisi sur la carte, prioritaire sur le cadre doré) ; étiquette « Sponsorisé » (icône `SparklesIcon` + texte) réintroduite dans la ligne des badges, indépendante du surlignage.
- `src/app/recherche/page.tsx` : `selected={deal.id === selectedId}` passé à chaque `DealCard`.
- `src/components/map/DealsMap.tsx` : même étiquette « Sponsorisé » ajoutée dans la fenêtre d'un repère.
- Revient en partie sur la tâche 35 de Matteo (étiquette « Sponsorisé » retirée alors, voir `DECISIONS.md`) : jugé nécessaire après ce retour concret.
- Vérifié : tsc + lint (1 avertissement connu) + build OK. Pas vu dans le navigateur (toujours indisponible dans cette session).
- Trouvé sur le disque en début de requête, sans rapport avec cette demande : `src/app/login/page.tsx` était revenu à l'ancien style (bleu, emoji) d'avant la refonte visuelle, non committé. Mis de côté (`git stash`, non appliqué) plutôt que perdu ou réappliqué sans demander : à vérifier avec l'utilisateur.

### 2026-11-27 soir — Justin (avertissement Next « instant navigation »)
- `next.config.ts` : `experimental.instantInsights.validationLevel: "manual-warning"` (choix de Justin).
- Cause : `RoleGate` n'affiche pas la page avant de connaître le type de compte ; message en développement seulement, sur toutes les pages étudiantes.
- Vérifié : message reproduit puis disparu (`next dev`, Chrome sans interface, faux Supabase) ; tsc + lint (1 avertissement connu) + build.

### 2026-11-27 21h58 — Sacha (Activité allégée, tâche 47)
- Nouveaux `components/cibles/MyDeals.tsx`, `ArrowHistory.tsx` ; modifiés `ActivityPanel`, `ActivityCard`, `MyDealCard`, profil, `lib/arrows.ts` (`fetchArrowLog`), textes de `DealSheet` et `PublishForm`, README.
- Vérifié : tsc + lint (1 avertissement connu) + build ; 64 contrôles dans Chrome sans interface avec un faux Supabase (390 et 320 px). Sans migration. **Pas testé sur la vraie base ni sur téléphone.**

### 2026-11-27 soir — Justin (adresse du site)
- Question seulement : site en ligne vérifié (page de connexion : réponse 200). Aucun code modifié.

### 2026-11-27 soir — Justin (site pas à jour)
- Diagnostic via les statuts publics GitHub : déploiements Vercel refusés (limite atteinte) depuis `9a3f9d3` ; dernier réussi `4b716f5`. `TASKS.md` annoté, aucun code modifié.

### 2026-11-27 soir — Anne-Lise (retour « ça ne marche pas » → déploiement Vercel cassé, pas un bug de code)
- Retour de l'utilisateur : le surlignage aubergine au clic ne s'affiche toujours pas en testant sur **le site déployé**.
- Testé en isolation (page temporaire locale avec de fausses données, auth contournée temporairement dans `src/proxy.ts`, tout supprimé/annulé après coup, aucune écriture sur la vraie base) : le clic met bien `selectedId` à jour et le style calculé passe à `border-color: rgb(75,42,99) (aubergine) / border-width: 2px`. Le code (`DealCard.tsx`, `recherche/page.tsx`, CSS) fonctionne.
- Cause réelle trouvée via l'API GitHub (`.../commits/<sha>/status`) : **les déploiements Vercel échouent depuis au moins 3 commits** (`9a3f9d3`, `adf2eb6`, `17087b2`) avec `failure` / `upgradeToPro=build-rate-limit`. Le site en ligne tourne donc sur un ancien build, sans les derniers correctifs (ni ceux d'aujourd'hui, ni peut-être d'autres avant) — **à signaler à toute l'équipe**, voir `DECISIONS.md`.
- Aucun changement de code nécessaire. Fichiers de test temporaires et modification locale de `proxy.ts` supprimés/annulés ; `npx tsc --noEmit`, `npm run lint`, `npm run build` revérifiés propres après nettoyage.

### 2026-11-27 soir — Justin (mise en ligne de secours)
- Projet Vercel `sharewood-ensai` créé, 3 variables ajoutées, `main` (`cf8e31b`) déployé : https://sharewood-ensai.vercel.app. README, TASKS, ARCHITECTURE, DECISIONS.
- Vérifié : pages publiques et redirection vers la connexion, URL et clé publique Supabase dans le site. **Connexion, GPS et photo IA pas essayés.**

### 2026-11-27 22h20 — Justin (déploiement à la demande)
- Nouveau `vercel.json` ; règle dans `CLAUDE.md` ; README, TASKS, ARCHITECTURE, DECISIONS. Aucun code d'application modifié, aucun déploiement lancé.

### 2026-11-27 soir — Justin (affichage sur ordinateur, tâche 48)
- `NavBar`, `layout`, `globals.css`, accueil, recherche, Ciblés (+ favoris, récompenses), profil, compte, confidentialité, préférences, publication, fiches, espace commerçant ; README, mémoire.
- Vérifié : tsc + lint (1 avertissement connu) + build ; Chrome sans interface avec un faux Supabase, comptes étudiant et commerçant, 1440 et 1100 px, retour à 390 px. Corrigé au passage : page Recherche qui défilait en plus de la liste. **Pas testé sur la vraie base, ni sur un vrai écran / autre navigateur ; non déployé.**

### 2026-11-27 22h38 — Justin (déploiement)
- `64acebe` (affichage ordinateur) mis en ligne sur https://sharewood-ensai.vercel.app depuis un clone propre. Vérifié : pages publiques et nouveaux styles servis ; connexion non essayée.

### 2026-11-27 soir — Justin (nouvelles tâches)
- Brainstorming de l'équipe ajouté dans `TASKS.md` (tâches 49 à 64, libres) et `DECISIONS.md`. Aucun code modifié.

### 2026-11-27 23h25 — Justin (pitch et vraies offres)
- `TASKS.md` : tâche 15 précisée et passée en priorité, tâche 65 ajoutée ; `DECISIONS.md`. Aucun code modifié.

### 2026-11-27 23h40 — Justin (diapos du pitch, tâche 15)
- Présentation « ShareWood — pitch » (claude.ai, privée) : couverture, problème, idée, démo, confiance, modèle économique, suite ; notes d'orateur minutées (3 min). Aucun code modifié. Prénoms, aucun chiffre de marché. **Pas encore relue ni répétée.**

### 2026-11-28 00h15 — Justin (diapos refaites)
- Présentation reconstruite sur le pitch de l'équipe : captures de l'application (faux serveur, offres d'exemple « (démo) »), diapo voyage / Erasmus, annexes confiance et modèle économique. Rendu vérifié en local. Aucun code modifié.

### 2026-11-28 nuit — Justin (diapos, troisième version)
- Pitch réécrit (à la demande de Justin) et placé dans les notes ; 10 diapos animées, moins de texte, sans annexes, avec une diapo modèle économique. Rendu vérifié en local (animations non vérifiées). Aucun code modifié.

### 2026-11-28 nuit — Justin (diapos, quatrième version)
- Introduction réunie sur une diapo, beaucoup plus de texte, 7 diapos. Rendu vérifié en local sans débordement. Aucun code modifié.

### 2026-11-28 nuit — Justin (diapos allégées)
- Petites mentions retirées, textes raccourcis et agrandis, mise en page conservée ; note de la diapo démo adaptée à une vidéo de 1 min max (pas encore fournie). Mentions gardées dans le texte : « bientôt » (Erasmus), « tarif envisagé ». Aucun code modifié.

### 2026-11-28 00h — Sacha (localisation, tâches 49 et 51)
- Migration `020_location_rules.sql` (+ `schema.sql`) ; `lib/location.ts`, `components/location/` ; `arrows.ts`, `engagement.ts`, `useUserPosition`, `DealsMap`, `LocationPicker`, assistant de préférences, `PublishForm`, fiche et boutons de réaction, Activité, profil, compte, politique de confidentialité, `seed_arrows.sql` (sarah 495, +5 puis +8, 358 disponibles) ; README, algorithmes, mémoire.
- Vérifié : tsc + lint (1 avertissement connu) + build ; 98 contrôles sur Postgres local + scénario de démo ; 37 contrôles dans Chrome avec un faux Supabase. **Pas essayé sur la vraie base ni sur téléphone ; conformité RGPD non relue par un juriste.**

### 2026-11-28 00h30 — Sacha (« Plus dispo » sur place)
- Migration `021_gone_on_site.sql` (+ `schema.sql`) ; textes de la fenêtre d'accord (nouvelle version, redemandée), du réglage, de la fiche, de l'Activité et de la politique de confidentialité ; README, algorithmes, mémoire.
- Vérifié : tsc, lint (1 avertissement connu), build ; 109 contrôles sur Postgres local + démo ; 39 contrôles dans Chrome avec un faux Supabase. Pas essayé sur la vraie base ni sur téléphone.

### 2026-11-28 00h40 — Justin (profil complet, tâches 63 et 64)
- Nouveaux `components/profile/{ProfileHeader,ImpactCard,ArrowsSummary,ProfileShortcuts}.tsx` ; `app/profil/page.tsx` ; README, mémoire. Sans migration.
- Vérifié : tsc + lint (1 avertissement connu) + build ; Chrome sans interface avec un faux Supabase (390, 320 et 1440 px, pseudo modifié, raccourcis). **Pas testé sur la vraie base ni sur téléphone ; non déployé.** Sonde en lecture : 020 présente sur la vraie base.

### 2026-11-28 00h39 — Justin (déploiement)
- 021 exécutée par Justin ; `a75ecf1` (profil complet, localisation) mis en ligne sur https://sharewood-ensai.vercel.app. Vérifié : pages publiques et redirections ; connexion non essayée.

### 2026-11-28 — Matteo (tâche 66 : « J'en ai profité »)
- Remplacement de « J'y suis allé » (53 occurrences) dans `src/` (`ReactionBar`, `DealSheet`, `QuickReactions`, `TrustBadge`, `MyDealCard`, `ArrowHistory`, `commercant/statistiques`, `confidentialite`, commentaires de `engagement`, `hot`, `offerStats`, `useDealReactions`), `README.md`, `docs/ALGORITHMES.md`, `schema.sql`, `seed_arrows.sql`, `TASKS.md`, `ARCHITECTURE.md`, `PROJECT.md`.
- `npm install` nécessaire après le pull (dépendance `qrcode` de la tâche 42, sinon le build échoue). Vérifié : tsc + lint (1 avertissement connu) + build. Pas vu dans le navigateur.

### 2026-11-28 00h45 — Sacha (onglets de l’accueil, tâche 56)
- `app/page.tsx` : Pour toi, Restauration (remplace Quotidien), Aides & bourses, Voyages, Culture & sport ; `Tabs.tsx` : colonne élargie pour un mot long ; README, algorithmes, mémoire.
- Vérifié : tsc, lint (1 avertissement connu), build ; Chrome avec un faux Supabase à 320, 360, 390 et 1100 px. Pas essayé sur téléphone ni déployé.

### 2026-11-28 nuit — Justin (boutons de zoom, tâche 61)
- `DealsMap.tsx` : boutons + et − au-dessus du recentrage, grisés aux limites ; zoom maximal fixé à 19. README, TASKS.
- Vérifié : tsc + lint (1 avertissement connu) + build ; Chrome sans interface avec un faux Supabase (390 px et 1440 px). Pas testé sur la vraie base ni sur téléphone ; non déployé.

### 2026-11-28 00h52 — Sacha (profil allégé)
- Retrait d’une partie des ajouts de Justin (tâches 63, 64) : `ImpactCard`, `ArrowsSummary`, `ProfileShortcuts` supprimés ; `app/profil/page.tsx` sur une colonne, en-tête conservé ; README, mémoire.
- Vérifié : tsc, lint (1 avertissement connu), build ; Chrome avec un faux Supabase à 320, 390 et 1440 px. Non déployé.

### 2026-11-28 — Matteo (libellé « J'en ai profité » non visible)
- Vérifié : le libellé est bien dans le code de `main` (`ReactionBar.tsx`, commit `e1e59b8`). Le site en ligne date du déploiement de `a75ecf1` (00h39), antérieur : il faut redéployer (poste de Justin). En local : `git pull`, `npm install`, relancer `npm run dev`. Aucun code modifié.

### 2026-11-28 — Matteo (tâche 67 : filtres de l'accueil)
- `src/app/page.tsx` : rangée de puces (Pour toi, Mes favoris, 6 catégories avec leur icône) à la place de `Tabs` ; catégories cumulables ; messages vides adaptés. `README.md`, `docs/ALGORITHMES.md`, mémoire.
- Vérifié : tsc + lint (1 avertissement connu) + build. Pas vu dans le navigateur (session Supabase requise, pas de banc d'essai dans le repo).

### 2026-11-28 01h30 — Justin (diapos en LaTeX, tâche 15)
- Nouveau dossier `pitch/` (`sharewood.tex`, `sharewood.pdf`, `images/`, `README.md`) ; `.gitignore`, README, mémoire. Aucun code d'application modifié.
- Vérifié : compilation avec TeX Live 2026 (avec et sans notes), 7 pages relues en image. Pas testé sur Overleaf ni sur un autre poste.

### 2026-11-28 01h26 — Sacha (refonte du profil, tâche 68)
- Migration `022_profile_impact_referral.sql` (+ `schema.sql`) ; `lib/community.ts`, `lib/share.ts`, `components/profile/` (impact, parrainage, menu, informations, notifications, aide), `ShareButton`, `/offre`, `DealSheet`, connexion (code parrainage), `proxy.ts`, export des données, politique de confidentialité, `seed_arrows.sql` ; README, algorithmes, mémoire.
- Vérifié : tsc, lint (1 avertissement connu), build ; 130 contrôles sur Postgres local + scénario de démo ; 42 contrôles dans Chrome avec un faux Supabase. **Pas essayé sur la vraie base ni sur téléphone ; non déployé.**

### 2026-11-28 01h28 — Sacha (demande de déploiement)
- Vérifié : build d’un clone neuf de `main` (`e5f548a`) réussi ; sonde en lecture : migration 022 absente de la vraie base. Déploiement non lancé (poste de Justin) : demande notée dans `TASKS.md`.

### 2026-11-28 01h31 — Justin (déploiement)
- `cc37d6c` (refonte du profil, filtres d'accueil, zoom) mis en ligne sur https://sharewood-ensai.vercel.app ; objets de la 022 détectés (sonde en lecture). Vérifié : pages publiques et redirections ; connexion non essayée.

### 2026-11-28 01h40 — Justin (vraies données, tâche 65 : étude)
- Sources recherchées et interrogées en lecture (CROUS, OpenAgenda, Aides Jeunes) ; proposition faite à Justin, choix en attente. Aucun code modifié.
