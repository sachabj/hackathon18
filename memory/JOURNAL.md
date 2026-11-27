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
