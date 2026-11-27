# TASKS — qui fait quoi

Statuts : `TODO` · `EN COURS (prénom)` · `À TESTER` (codé, pas essayé sur la vraie base) · `FAIT` · `BLOQUÉ (raison)`

_Mis à jour le 27/11 après relecture de tout le code (lint : 1 avertissement connu dans `LogoutButton` ; build OK). L'historique est dans `JOURNAL.md`._

**Avant de coder** : mettre `EN COURS (prénom)` ici et pousser ; poser les questions prévues par `CLAUDE.md`.

## 🚀 Mise en ligne (à la demande, voir `CLAUDE.md`)
- **Dernier déploiement : `cf8e31b`, 27/11 à 22h16** (Justin) → **https://sharewood-ensai.vercel.app** (site à utiliser pour la démo).
- Ancien site `hackathon18-t1lb` : figé sur `4b716f5` (limite Vercel atteinte, puis déploiement au push coupé).

## Base de données
- Migrations **004 à 009 présentes sur la vraie base** (détectées via l'API le 27/11 ; stockage `deal-photos` répond).
- **010 et 011 exécutées** (Justin, 27/11 ; colonnes de la 010 vérifiées via l'API).
- **012 présente sur la vraie base** (colonne `link_url` détectée via l'API le 27/11).
- **Sonde de la vraie base (Justin, 27/11 au soir, lecture seule)** : objets de **014 et 016 présents**, tables de **017 absentes** ; 013 et 015 non vérifiables avec la clé publique (à confirmer par qui les a lancées). Les lignes ⏳ ci-dessous datent d'avant cette sonde.
- ⏳ **013_unvote.sql à exécuter** (Matteo) : sans elle, décocher une réaction affiche « base pas à jour » (cocher marche).
- ⏳ **014_voter_weights.sql à exécuter** (Matteo, après 013) : poids des étudiants pour la fiabilité.
- ⏳ **015_demo_titles.sql** (Matteo, données seulement) : retire « [Exemple] » des titres déjà en base.
- ⏳ **016_arrows.sql à exécuter** (Sacha, après 013 et 014) : Flèches et archivage à 3 signalements ; puis, pour la démo, `reset_demo.sql` et `seed_arrows.sql` (**le jour de la démo** ; demande 016 et 017).
- ⏳ **017_rewards.sql à exécuter** (Sacha, après 016) : boutique de récompenses.
- ⏳ **018_no_access_limit.sql à exécuter** (Sacha, après 017) : accès ouvert à tous et 3 publications récompensées par jour. Relancer 018 si 009 ou 016 sont relancées.
- **Sonde en lecture (Sacha, 27/11 au soir)** : table de **017 présente** et fonction supprimée par **018 absente** → 017 et 018 appliquées.
- ⏳ **019_golden_badge_text.sql à exécuter** (Sacha) : texte du Badge Doré dans la boutique.
- Prochaine migration : numéro **020** (vérifier après un pull). Toute modification : fichier dans `supabase/migrations/` + `schema.sql` + GRANT, puis la faire lancer dans le SQL Editor.

## Équipe (domaines actuels)
| Membre | Domaine |
|---|---|
| Justin | Squelette, base, déploiement, carte, votes, profil, commerçants, données de démo |
| Sacha | Fil « Pour toi », préférences, compte et confidentialité |
| Matteo | Publication, assistant IA, photo de preuve |
| Anne-Lise | Favoris, design |

## 🔴 À faire en priorité : modifications demandées (18 à 27)
Lots A, B et C codés par Justin, lot D fait par Matteo.

| # | Lot | Tâche | Statut |
|---|---|---|---|
| 18 | A | % de compatibilité remplacé par le % de fiabilité sur les cartes | À TESTER (Justin) |
| 23 | A | Menu carte : enlever la barre du haut | À TESTER (Justin) |
| 25 | A | « Pour toi » → bascule auto sur « Tout » si catégorie hors profil | Remplacée par la tâche 31 (ces onglets n'existent plus) |
| 26 | A | Accueil simple (résumé + réductions) et carte dans un onglet « Recherche » (inclut l'ancienne tâche 16) | À TESTER (Justin) |
| 19 | B | Carte : enlever les cercles en pointillés des zones | À TESTER (Justin) |
| 24 | B | Carte : un seul bouton « revenir à ma localisation » | À TESTER (Justin) |
| 20 | C | 1re connexion : « Me localiser » + menu pays → ville-campus | À TESTER (Justin) |
| 21 | C | Inscription : une question « fréquence de voyage » + moyens | À TESTER (Justin) |
| 22 | C | Inscription : « Boursier ? » à la place des choix Carte Sortir et Bourses (migration) | À TESTER (Justin) |
| 27 | D | Publication : relecture IA remplacée par une recherche de doublon sans IA | FAIT (Matteo) : « Déjà partagé ici » dès le choix du lieu (même `place_name`), zone / partout au clic sur Publier (même catégorie + zone), « Bon plan validé » ; `findDuplicateCandidates` remplacé par `src/lib/duplicates.ts` |
| 28 | E | Carte Sortir n'est plus une catégorie mais une **condition** (`deals.requirements[]` : carte étudiante, Carte Sortir, boursier, -26 ans) ; lien d'offre (`deals.link_url`) + URL cliquables (migration 012, `reset_demo.sql` modifié) | À TESTER (Matteo) : 012 présente en base |
| 29 | E | Réactions : « Toujours dispo » retiré (« J'y suis allé » = passage + confirmation) ; « J'y suis allé » et « Plus dispo » exclusifs et décochables (migration 013 : retirer son vote) | À TESTER (Matteo) : ⏳ **lancer `013_unvote.sql`** |
| 30 | E | Fiabilité en code couleur (rouge / jaune / vert clair / vert foncé + mot court) à la place du % sur les cartes et la fiche | FAIT (Matteo) : `TRUST_LEVELS` / `trustLevel()` dans `rules.ts`, `components/deal/TrustBadge.tsx` ; fenêtre de la carte et stats commerçant inchangées |
| 32 | E | Tri « Hot » de l'onglet « Tout » (réactions récentes, nombre de « J'y suis allé », fraîcheur) + badge « Tendance » | FAIT (Matteo) : `src/lib/hot.ts` (réglages dans `HOT`), `recherche/page.tsx`, `DealCard.tsx`, `useDeals.ts` (`loadedAt`) ; sans migration. ⚠️ **Sacha (tâche 31)** : le tri Hot est dans l'onglet « Tout » de `recherche/page.tsx` ; si cet onglet disparaît, garder `hotScore()` pour trier la liste restante (ou les rubriques de l'accueil) |
| 33 | E | Fiabilité façon Waze : poids par utilisateur (justesse passée, ancienneté / activité), confiance qui s'érode, « Plus dispo » récent ×1,5, masquage selon le poids, rang dans le profil (migration 014) | À TESTER (Matteo) : ⏳ **lancer `014_voter_weights.sql`** (sans elle : calcul local à poids égal, pas de rang) |
| 34 | E | Recherche de l'accueil : toutes les offres, les plus pertinentes d'abord, fautes de frappe, pluriels et mots proches | À TESTER (Sacha) : croix pour annuler, bouton et touche « Rechercher » (à voir sur un vrai téléphone) ; `lib/search.ts` (listes `SAME` et `RELATED` à compléter), `app/page.tsx` ; sans migration. Aucune offre « kebab » dans les données de démo |
| 35 | E | Carte de bon plan épurée : réactions « J'y suis allé (n) » / « Plus dispo (n) » directement sur la carte, plus de « Voir et réagir », plus de « Sponsorisé » (cadre doré seul), raisons « Pour toi » retirées (sauf la distance), description / photo / lien dans la fiche | À TESTER (Matteo) : `DealCard`, `DealSheet`, fenêtre de `DealsMap` ; `ReactionBar`, `useDealReactions`, `QuickReactions` ; sans migration ; pas vu dans le navigateur |
| 37 | E | Démo et cartes : « [Exemple] » retiré des titres (mention gardée dans la fiche, migration 015), montant () retiré de l'affichage et des formulaires (le titre dit l'avantage), flamme « Tendance » retirée | À TESTER (Matteo) : ⏳ **lancer `015_demo_titles.sql`** si `reset_demo.sql` a déjà été lancé ; sinon relancer `reset_demo.sql` (à jour). `price_info` reste en base (recherche, anciennes offres) mais n'est plus ni saisi ni affiché |
| 38 | E | Carte d'un bon plan : lieu · distance sur une ligne pleine largeur (icône repère), sous la ligne titre / fiabilité / cœur | FAIT (Matteo) : `DealCard.tsx` ; pas vu dans le navigateur |
| 39 | E | Plus de formule d'accueil « Bonjour <pseudo> » / « Les bons plans étudiants » en haut de l'Accueil et de Recherche (titre gardé pour les lecteurs d'écran) | FAIT (Matteo) : `app/page.tsx`, `app/recherche/page.tsx` (fichiers de Sacha / Justin) |
| 40 | E | Document `docs/ALGORITHMES.md` : visibilité, ordre d'affichage (sponsorisées, compatibilité, Hot, recherche), fiabilité (poids, masses, score, archivage), limites, où régler | FAIT (Matteo) : **à mettre à jour à chaque changement de formule** |
| 36 | E | Filtres sous la recherche (prix, moyen + temps de trajet, conditions, tri) ; « gratuit », « pas cher », « près de moi » compris dans la saisie. « Ouvert maintenant » remis à plus tard (aucune donnée d'horaires) | À TESTER (Sacha) : `lib/search.ts`, `lib/searchFilters.ts`, `components/feed/SearchFilters.tsx`, `app/page.tsx` |
| 41 | E | Filtre « Ouvert maintenant » : aucune donnée d'horaires (il faudrait une saisie à la publication + migration, ou un service externe) | TODO, remis à plus tard (Sacha) |
| 42 | E | Onglet « Ciblés » (à la place de Favoris) : carte Flèches + influence, onglets Favoris / Activité / Récompenses ; boutique, échanges, bons avec QR code (migration **017**) ; profil allégé. Touche `favoris/page.tsx` (Anne-Lise), `NavBar`, `profil/page.tsx` (Justin), `InfluenceCard` (Matteo) | À TESTER (Sacha) : ⏳ **lancer `017_rewards.sql`** ; `npm install` après le pull (nouvelle dépendance `qrcode`) ; testé sur Postgres local et faux Supabase seulement |
| 43 | E | Plus d'accès limité selon l'activité (ni 7 jours, ni retard de 24 h) ; 3 publications récompensées par jour (migration **018**). Niveaux d'activité conservés. Touche `ActivityCard` (Justin), `PublishForm` et `docs/ALGORITHMES.md` (Matteo) | À TESTER (Sacha) : ⏳ **lancer `018_no_access_limit.sql`** ; testé sur Postgres local et faux Supabase seulement |
| 44 | E | Carte de « Ciblés » : bloc « Grade » (Éclaireur / Chasseur de bons plans / Robin des Étudiants, un seul éclairé) à la place de « Ton influence » et de la pastille de rang | À TESTER (Sacha) : essayé avec un faux Supabase ; sans migration |
| 45 | E | « Partager » plus rapide : seuls lieu, titre et catégorie visibles, le reste sous « Plus de détails » ; photo analysée dès qu'elle est prise. Touche `PublishForm`, `AssistPanel` (domaine de Matteo, avec son accord) | À TESTER (Justin) : essayé avec un faux Supabase et une IA simulée ; à essayer sur téléphone (appareil photo) et avec la vraie IA ; sans migration. **Matteo** : photo analysée sans bouton, « Coller un texte » devient « Texte », portée et catégories en puces, `ChoiceTile` plus utilisé ici |
| 46 | E | Profil : retrait du bouton « Utiliser mes Flèches » et du Badge Doré (visible dans « Ciblés ») ; description de la récompense corrigée (migration **019**) | À TESTER (Sacha) : ⏳ **lancer `019_golden_badge_text.sql`** |
| 47 | E | « Ciblés > Activité » allégé : niveau sur une ligne (sans spécialité), « Mes bons plans » (déplacés du profil, lignes dépliables avec leurs Flèches), historique sans ces gains. Touche `profil/page.tsx`, `MyDealCard`, `ActivityCard` (Justin), texte de `DealSheet` | À TESTER (Sacha) : essayé avec un faux Supabase ; sans migration |

### Lots A, B, C : codés (Justin), à tester sur la vraie base et sur téléphone
- Depuis la tâche 31 (Sacha) : `/` = recherche + onglets « Pour toi » / Voyager / Aides & bourses / Culture & sport / Quotidien · `/recherche` = catégories, carte et liste de toutes les offres.
- **Matteo** : le bouton « Voir sur la carte » de `PublishForm` pointe maintenant vers `/recherche` (modifié par Justin).
- **Sacha** : `matching.ts`, `preferences.ts`, `PreferencesWizard.tsx`, `confidentialite` modifiés ; `StudentProfile` perd `wantsTravel` et gagne `isScholar`, `hasCarteSortir` ; le récapitulatif et le profil partagent `preferenceRows()`.
- **Anne-Lise** : `DealCard` affiche la fiabilité ; `/favoris` lit `votes(*)` ; barre du bas à 5 onglets.

### Badges et filtre « Commerçant / Étudiant » : FAIT (Justin)
- Remplace le badge « Grande enseigne » (demandé par erreur, supprimé) et la mention « Offre officielle » : `components/AuthorBadge.tsx` (commerçant = `is_official`) ; filtre Tous / Commerçants / Étudiants dans `/recherche`.
- `DealCard`, `DealSheet`, `DealsMap` modifiés : faire un pull avant d'y toucher.

### Bouton « Y aller » : FAIT (Justin)
- Dans la fiche d'un bon plan placé sur la carte : Apple Plans sur appareil Apple, Google Maps ailleurs (`src/lib/directions.ts`).
- **Matteo (tâche 28)** : `DealSheet.tsx` et `confidentialite/page.tsx` modifiés : faire un pull avant de les toucher.

### Accueil et page carte (tâche 31, Sacha)
- **Justin** : `app/page.tsx` réécrit ; sur `app/recherche/page.tsx`, retrait des filtres « Pour toi / Tout » et « Tous / Commerçants / Étudiants » (les badges des cartes restent) ; catégories et carte inchangées.
- **Matteo** : `hotScore()` conservé : il trie maintenant la liste unique de `/recherche` (sponsorisées en tête) ; pas appliqué aux onglets de l'accueil.

## 🐞 Défauts relevés à la relecture (à prendre, noter son prénom)
Relevés en lisant le code, pas encore reproduits dans l'app.

| # | Priorité | Défaut | Statut |
|---|---|---|---|
| D1 | Haute | **On peut voter sur son propre bon plan** : « C'est le même : je le confirme » ne filtre pas ses offres et la règle `voter` de la base l'autorise → fiabilité gonflée et accès 7 jours relancé à volonté. Corriger dans l'app (avec la tâche 27) **et** par une règle en base (migration) | FAIT (Justin) : app corrigée (tâche 27) + règle en base (011 exécutée) ; pas essayé sur la vraie base |
| D2 | Haute (Justin) | La copie locale `supabase/reset_demo.local.sql` de Justin est **périmée** (ne supprime pas les bons plans avant les comptes, depuis la 009) : la refaire à partir de `reset_demo.sql` avant tout lancement | FAIT (Justin) : copie locale reconstruite depuis le script à jour |
| D3 | Moyenne | `/favoris` affiche les bons plans expirés ou retirés sans le signaler | TODO |
| D4 | Moyenne | Après un vote dans la fiche, le fil et la carte ne se rafraîchissent qu'au retour sur la page (`useDeals`) | TODO |
| D5 | Basse | Une erreur d'ajout / retrait de favori n'est affichée nulle part (`useFavorites.error`) | TODO |
| D6 | Basse | `CategoryIcon` annonce l'identifiant anglais (`supermarket`) aux lecteurs d'écran : aucun appel ne passe `label` | FAIT (Matteo) : libellé français par défaut |
| D7 | Basse | Longueurs maximales différentes : publication titre 80 / prix 80, modification et offre commerçant 100 / 40 ; aucune limite en base | TODO |
| D8 | Basse | Restes de l'ancien style : `themeColor` bleu (`layout.tsx`), gris `zinc` dans `RoleGate`, `DealsMapLoader`, `BusinessForm` | TODO |
| D9 | Basse | `/api/assist` sans limite par utilisateur (un compte peut épuiser le quota de la clé) | TODO |
| D10 | Moyenne | Inscription : une tuile choisie ne change ni de fond ni de bordure (seule la coche s'affiche) : `.sw-card` l'emporte sur les classes Tailwind de `ChoiceTile` (vu dans le navigateur) | FAIT (Justin) : tuile choisie en bordure vert forêt + fond sauge |
| D11 | Basse | Sur un écran de 320 px de large, la barre du bas dépasse : « Profil » est coupé (`NavBar.tsx`, vu dans le navigateur) | TODO |

## Autres tâches
| # | Tâche | Statut |
|---|---|---|
| 11 | Notif sur place simulée (« toujours dispo ? ») + bouton « Simuler ma position » dans `/profil` | TODO |
| 12 | Données de démo : `reset_demo.sql` (~150 bons plans à 15 km de Bruz, 20 étudiants, 12 commerces **fictifs**) ; **à lancer** (012 déjà présente) ; revérifier les prix sourcés avant la démo | EN COURS (Justin) : testé en local, copie locale à jour |
| 31 | Accueil en onglets (« Pour toi » + les 4 rubriques) avec barre de recherche ; filtres « Pour toi / Tout » et « Commerçant / Étudiant » retirés de la page carte | À TESTER (Sacha) : onglets rectangulaires ; codé et essayé avec un faux Supabase ; à voir sur la vraie base et sur téléphone ; sans migration |
| 14 | Rappels de dates limites | TODO |
| 15 | Pitch / slides (modèle économique commerçants) | TODO |
| 17a | Compte et confidentialité (`/compte`, `/confidentialite`) | À TESTER (Sacha) ; remplir `PRIVACY_CONTACT` (`constants.ts`) pour afficher un contact |
| 17b | « Les Flèches » : points calculés par la base (barème, série × 1,5, 5 votes payés par jour, moitié au-delà de 500 m et rien au-delà de 2 km, archivage à 3 signalements), rangs, solde dans les en-têtes, fiche, profil, données de démo | À TESTER (Sacha) : ⏳ **lancer `016_arrows.sql`**, puis `seed_arrows.sql` ; testé sur Postgres local et faux Supabase seulement |

## Recherche déplacée sur Accueil → Recherche (Anne-Lise)
- **Décision demandée par l'utilisateur** : la barre de recherche (+ ses filtres prix/trajet/condition/tri) quitte l'Accueil pour `/recherche` ; les catégories de `/recherche` sont retirées (gain de place) ; dans une liste de `/recherche` (recherche ou fil « Hot »), toucher une offre **localisée** centre et met en avant son repère sur la carte (contour aubergine, petit rebond) au lieu d'ouvrir sa fiche — pour comparer vite plusieurs offres. Une offre **sans lieu** (zone / nationale) garde l'ouverture de sa fiche (rien à montrer sur la carte).
- **Touché** : `src/app/page.tsx` (Sacha : n'a plus que les onglets, tout le bloc recherche retiré), `src/app/recherche/page.tsx` (Justin/Sacha : reçoit la recherche + filtres, perd les puces de catégorie, carte toujours sur toutes les offres localisées), `src/components/feed/DealCard.tsx` (nouveaux props optionnels `onSelect` et `selected`, comportement par défaut inchangé partout ailleurs — Accueil, Favoris, etc. : l'ouverture de la fiche au toucher est gardée là où `onSelect` n'est pas fourni), `src/components/map/DealsMap.tsx` (nouveau prop `selectedId`, icônes « sélectionné »), `globals.css` (`.wz-pin-selected`).
- **Suite (retour utilisateur)** : l'offre choisie est aussi surlignée dans la liste (pas seulement sur la carte) ; étiquette « Sponsorisé » revenue sur `DealCard` et la fenêtre de `DealsMap` (revient en partie sur la tâche 35 de Matteo : le cadre doré seul n'était pas compris).
- **Pourquoi** : demande d'Anne-Lise (questions posées avant de coder : contenu restant sur l'Accueil, clic = surligner seul vs ouvrir la fiche, portée du surlignage, coordination avec Sacha/Justin) → toutes les options recommandées choisies.
- Vérifié : tsc + lint + build OK. `npm install` fait (dépendance `qrcode` de la tâche 42, manquante après le pull). Pas vu dans le navigateur (toujours indisponible dans cette session).

## Les Flèches : à régler (Sacha)
- **Sans position, pas de pénalité** (décision provisoire, à revoir) : refuser la localisation, ou voter hors de l'app, contourne le barème de distance ; une position peut aussi être falsifiée.
- Publications récompensées plafonnées à 3 par jour (018) ; des comptes complices peuvent encore confirmer des offres bidon.
- 3 « Plus dispo » archivent une offre, officielle ou non, quel que soit le nombre de confirmations ; les signalements ne périment pas.
- **Récompenses** (tâche 42) : partenaires fictifs ; « Avant-Première » seulement enregistrée (aucune offre flash n'existe) ; aucun tirage de tombola codé ; le commerçant ne peut pas vérifier un code (c'est l'étudiant qui marque le bon utilisé).

## À prendre en compte (depuis les Flèches, Sacha)
- **Matteo** : le masquage pondéré (tâche 33) est remplacé par l'archivage à 3 signalements (`isDealHidden(deal, votes, now)` ; `minVotesToHide` supprimé) ; la fiabilité pondérée ne sert plus qu'à la couleur. `vote()` passe par la RPC `react_to_deal` (toujours l'utiliser, y compris dans `PublishForm`) ; « +10 / +15 » ajoutés sur les boutons de réaction ; `DealSheet`, `ReactionBar`, `duplicates.ts` modifiés.
- **Justin** : `profil/page.tsx` (carte Flèches en haut, le reste conservé), statut « Archivé » dans `MyDealCard` / `OfferCard` / `offerStats` ; après `reset_demo.sql`, lancer `seed_arrows.sql` (rien à changer dans ton script).
- **Anne-Lise** : solde de Flèches ajouté dans l'en-tête des favoris ; nouvelle icône `ArrowShotIcon`.

## À prendre en compte (depuis « Ciblés », Sacha)
- **Tous** : `npm install` (dépendance `qrcode`).
- **Anne-Lise** : l'onglet « Favoris » devient « Ciblés » (même adresse `/favoris`) ; ta liste est dans `components/cibles/FavoritesPanel.tsx`, comportement inchangé ; `NavBar` et `icons.tsx` (`HeartArrowIcon`) modifiés.
- **Justin** : le profil perd la carte Flèches, l'influence et `ActivityCard` (déplacée dans « Ciblés > Activité ») et gagne « Utiliser mes Flèches ».
- **Matteo** : `InfluenceCard.tsx` devient un bloc sans carte, affiché sous les Flèches dans « Ciblés » ; `docs/ALGORITHMES.md` corrigé (emplacement du rang). Onglets rectangulaires partagés : `components/Tabs.tsx`.

## À prendre en compte (depuis la fin de l'accès limité, Sacha)
- **Justin** : `ActivityCard` ne montre plus que le niveau (props réduites à `contributions`) ; la ligne de `reset_demo.sql` qui rend trois comptes inactifs ne sert plus à rien (sans effet).
- **Matteo** : phrase « 7 jours d'accès complet » retirée de `PublishForm` ; `docs/ALGORITHMES.md` mis à jour ; `active_users_in_zone` supprimée.

## À prendre en compte (depuis le bloc « Grade », Sacha)
- **Matteo** : le rang d'influence n'est plus affiché : `InfluenceCard.tsx`, `INFLUENCE_RANKS`, `influenceRank` et `fetchMyInfluence` supprimés (la RPC `my_influence` reste en base, inutilisée). Le calcul de fiabilité ne change pas ; `docs/ALGORITHMES.md` corrigé.

## À prendre en compte (depuis le profil sans Flèches, Sacha)
- **Justin** : `profil/page.tsx` ne montre plus rien des Flèches (`UseArrowsLink.tsx` supprimé).

## À prendre en compte (depuis l'onglet Activité, Sacha)
- **Justin** : « Mes bons plans » quitte le profil pour « Ciblés > Activité » (`components/cibles/MyDeals.tsx`) ; `MyDealCard` devient une ligne dépliable (audience en une ligne, Flèches, totaux retirés) ; `ActivityCard` tient sur une ligne, sans spécialité.
- **Matteo** : dans `PublishForm`, « C'est ton bon plan » renvoie vers « Ciblés, onglet Activité ».

## Codé : état des essais
| # | Fonction | Statut |
|---|---|---|
| 5 | Carte, GPS « autour de moi », fil « Pour toi » et filtres | FAIT (pas essayé sur téléphone) |
| 6 | Publication (lieu via Photon), assistant IA, photo de preuve | Publication et Gemini testés en vrai (Matteo) ; **affichage de la photo à tester** (migration 008 désormais présente) ; **ajouter `GEMINI_API_KEY` sur Vercel (Sacha)** puis redéployer, si pas déjà fait |
| 7 | Votes, fiabilité, masquage | À TESTER |
| 8 | Favoris par catégorie | À TESTER |
| 9 | Préférences et parcours d'inscription | À TESTER |
| 10 | Profil et « Ciblés » : niveaux, mes bons plans et audience (accès 7 jours abandonné, tâche 43) | À TESTER |
| 13 | Espace commerçant : offres, retrait, statistiques, mise en avant | À TESTER |

Terminées : 1 (mémoire + git), 2 (stack, nom), 3 (squelette + déploiement https://hackathon18-t1lb.vercel.app), 4 (base + droits testés).

## Règles à connaître avant de modifier le code
- **README.md** : à mettre à jour dans le même commit à chaque changement visible (règle de `CLAUDE.md`). Tâche 43 reportée (Sacha).
- **Algorithmes** (tri, compatibilité, Hot, recherche, fiabilité) : expliqués dans `docs/ALGORITHMES.md` ; le mettre à jour si on change une formule ou une constante.
- Toute nouvelle donnée ou tout nouveau service externe → mettre à jour `src/app/confidentialite/page.tsx`.
- `deals.author_id` peut être `null` (compte supprimé) ; les profils des autres ne sont pas lisibles.
- `boosted_until` et `ended_by` ne sont pas écrivables ; toute nouvelle colonne de `deals` ou `profiles` doit être ajoutée aux GRANT.
- Un compte commerçant ne voit pas les pages étudiantes (`RoleGate`) : tester avec un compte étudiant.
- Pas d'emoji dans l'app : `components/icons.tsx`, `CategoryIcon`, classes `.sw-*` (`DESIGN_SHAREWOOD.md`).
- `/profil` : prévenir Sacha avant de le modifier (ajouts en sous-pages) ; garder `LogoutButton` et `AccountLink`.
- **Carte Sortir n'est plus une catégorie** (tâche 28) : c'est une condition (`deals.requirements`, `REQUIREMENTS` dans `constants.ts`), comme la carte étudiante. Affichage : `components/deal/DealExtras.tsx` (`RequirementBadges`, `OfferLink`, `LinkedText`). Liens : toujours passer par `src/lib/links.ts` (`normalizeLink` à l'écriture, `safeLink` à l'affichage).
- **Réactions (tâche 29)** : plus de « Toujours dispo ». « J'y suis allé » = passage (`deal_visits`) + vote +1 ; « Plus dispo » = vote −1 ; exclusifs, recliquer décoche (`setReaction` dans `engagement.ts`). **Justin** : `DealSheet.tsx`, `engagement.ts`, libellés de `MyDealCard` (« Confirmé ») et des statistiques commerçant modifiés.
- **Fiabilité (tâche 33)** : toujours passer par `reliability()` / `dealTrustLevel()` / `isDealHidden()` de `rules.ts` avec `deal.trust` (masses pondérées, `withTrust()` de `lib/trust.ts`). Constantes en double dans `014_voter_weights.sql` : modifier aux deux endroits. **Justin** : `profil/page.tsx` (+ `InfluenceCard`), `DealSheet`, `engagement.ts`, `useDeals.ts` modifiés. **Sacha** : `confidentialite` (poids des réactions) et `favoris` modifiés.
- **Carte d'un bon plan (tâche 35)** : ne rien y rajouter sans en discuter (« réduire à l'essentiel »). Réactions via `useDealReactions` + `ReactionBar` (compteurs sur 30 jours, `recentCounts`). `Match.distance` (seule raison affichée) ajouté dans `matching.ts` (**Sacha**) ; les autres `reasons` / `warnings` restent calculées mais ne sont plus montrées. **Justin** : fenêtre de `DealsMap` (plus de « Sponsorisé », de description ni de « Voir et réagir » : réactions directes + « Détails › ») et `DealSheet` (photo, `ReactionBar`, `onReactionsChange`) modifiés ; `setVisited` fait un upsert.
- **Montant (tâche 37)** : plus de champ « Prix » (publication, mes bons plans, offre commerçant) ni d'affichage ; le titre dit l'avantage. Garder `price_level` (filtres de Sacha). **Justin** : `reset_demo.sql` (titres sans « [Exemple] », contrôle final compté sur la description), `OfferForm`, `OfferCard`, `commercant/page.tsx`, `DealsMap`, `DealSheet` modifiés : refaire `reset_demo.local.sql`.
- Publication : l'IA ne reçoit rien au moment de publier, seulement avec « Pré-remplir avec l'IA » ; les doublons passent par `src/lib/duplicates.ts` (plus de modération automatique).
- Avertissement Next « instant navigation » (développement) : coupé dans `next.config.ts` (relancer `npm run dev` après le pull) ; une page ne le réactive qu'avec `export const instant`.
- Next conserve les pages quittées : les effets sont relancés au retour (cartes Leaflet à démonter).

## Planning (deadline sam. 28/11 13h00)
- **Ven. soir** : fin de la tâche 28
- **Sam. matin** : tests réels, données de démo, finitions
- **Sam. 11h–13h** : gel du code, pitch, répétition
