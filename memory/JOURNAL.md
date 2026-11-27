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

### 2026-11-27 16h30 — Matteo (Gemini pour l'assistant IA)
- `src/lib/ai/assist.ts` (fournisseur Gemini ou Claude selon la clé, revérification des champs), `src/app/api/assist/route.ts` (erreurs Gemini : quota, clé, modèle), `.env.example` ; dépendance `@google/genai`.
- Vérifié : lint + build. **Appel réel à Gemini pas testé (pas de clé sur ce poste)** ; nom du modèle par défaut repris de la doc du SDK, modifiable via `GEMINI_MODEL`.
