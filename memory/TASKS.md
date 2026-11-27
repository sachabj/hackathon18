# TASKS — qui fait quoi

Statuts : `TODO` · `EN COURS (prénom)` · `À TESTER` (codé, pas essayé sur la vraie base) · `FAIT` · `BLOQUÉ (raison)`

_Mis à jour le 27/11 après relecture de tout le code (lint : 1 avertissement connu dans `LogoutButton` ; build OK). L'historique est dans `JOURNAL.md`._

**Avant de coder** : mettre `EN COURS (prénom)` ici et pousser ; poser les questions prévues par `CLAUDE.md`.

## Base de données
- Migrations **004 à 009 présentes sur la vraie base** (détectées via l'API le 27/11 ; stockage `deal-photos` répond).
- **010 et 011 exécutées** (Justin, 27/11 ; colonnes de la 010 vérifiées via l'API).
- **012 présente sur la vraie base** (colonne `link_url` détectée via l'API le 27/11).
- ⏳ **013_unvote.sql à exécuter** (Matteo) : sans elle, décocher une réaction affiche « base pas à jour » (cocher marche).
- ⏳ **014_voter_weights.sql à exécuter** (Matteo, après 013) : poids des étudiants pour la fiabilité.
- Prochaine migration : numéro **015** (vérifier après un pull). Toute modification : fichier dans `supabase/migrations/` + `schema.sql` + GRANT, puis la faire lancer dans le SQL Editor.

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
| 36 | E | Filtres sous la recherche (prix, moyen + temps de trajet, conditions, tri) ; « gratuit », « pas cher », « près de moi » compris dans la saisie. « Ouvert maintenant » remis à plus tard (aucune donnée d'horaires) | À TESTER (Sacha) : `lib/search.ts`, `lib/searchFilters.ts`, `components/feed/SearchFilters.tsx`, `app/page.tsx` |
| 37 | E | Filtre « Ouvert maintenant » : aucune donnée d'horaires (il faudrait une saisie à la publication + migration, ou un service externe) | TODO, remis à plus tard (Sacha) |

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
| 17b | Crédits et badges : calculés par la base, avec règles anti-triche (voir D1) | TODO (Sacha) |

## Codé : état des essais
| # | Fonction | Statut |
|---|---|---|
| 5 | Carte, GPS « autour de moi », fil « Pour toi » et filtres | FAIT (pas essayé sur téléphone) |
| 6 | Publication (lieu via Photon), assistant IA, photo de preuve | Publication et Gemini testés en vrai (Matteo) ; **affichage de la photo à tester** (migration 008 désormais présente) ; **ajouter `GEMINI_API_KEY` sur Vercel (Sacha)** puis redéployer, si pas déjà fait |
| 7 | Votes, fiabilité, masquage | À TESTER |
| 8 | Favoris par catégorie | À TESTER |
| 9 | Préférences et parcours d'inscription | À TESTER |
| 10 | Profil : accès 7 jours, niveaux, mes bons plans et audience | À TESTER |
| 13 | Espace commerçant : offres, retrait, statistiques, mise en avant | À TESTER |

Terminées : 1 (mémoire + git), 2 (stack, nom), 3 (squelette + déploiement https://hackathon18-t1lb.vercel.app), 4 (base + droits testés).

## Règles à connaître avant de modifier le code
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
- Publication : l'IA ne reçoit rien au moment de publier, seulement avec « Pré-remplir avec l'IA » ; les doublons passent par `src/lib/duplicates.ts` (plus de modération automatique).
- Next conserve les pages quittées : les effets sont relancés au retour (cartes Leaflet à démonter).

## Planning (deadline sam. 28/11 13h00)
- **Ven. soir** : fin de la tâche 28
- **Sam. matin** : tests réels, données de démo, finitions
- **Sam. 11h–13h** : gel du code, pitch, répétition
