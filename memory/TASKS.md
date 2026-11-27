# TASKS — qui fait quoi

Statuts : `TODO` · `EN COURS (prénom)` · `FAIT` · `BLOQUÉ (raison)`

## Équipe
| Membre | Rôle |
|---|---|
| Sacha | Fil + filtres (tâche 5b) |
| Anne-Lise | Votes, fiabilité, favoris (7, 8) |
| Matteo | Publication (6), accès 7 jours, niveaux, notif simulée (10, 11) |
| Justin | Squelette, BDD, déploiement (3, 4), carte (5a), puis commerçants / rappels (13, 14) |

✅ Répartition validée (ajustable) : **Justin** = squelette, BDD Supabase, déploiement · **Sacha** = fil + filtres (carte reprise par Justin) · **Anne-Lise** = publication, votes, fiabilité, favoris · **Matteo** = accès 7 jours, niveaux, notif simulée (préférences reprises par Sacha) · **tout le monde** = données de démo + pitch.

## Tâches
| # | Tâche | Statut |
|---|---|---|
| 1 | Mettre en place la mémoire partagée + git | FAIT |
| 2 | Valider la stack, le nom (ShareWood) et les propositions | FAIT |
| 3 | Squelette Next.js + déploiement Vercel (https://hackathon18-t1lb.vercel.app) | FAIT |
| 4 | BDD Supabase : schéma + migrations 002 et 003, test e2e OK | FAIT |
| 5a | Carte Bruz / Ker Lann + écran d'accueil (Justin) | FAIT |
| 5c | Localisation GPS : carte centrée sur l'utilisateur + « Autour de moi » (Justin) | FAIT |
| 5b | Fil + filtres par catégorie (Sacha) : onglets « Pour toi » / « Tout » dans `src/app/page.tsx` | FAIT |
| 6 | Formulaire de publication (local / zone / national) — Matteo : magasin + ville → lieu exact via Photon (OSM), tous les champs saisis à la main | FAIT (testé sur la vraie base) |
| 6b | Assistant IA de publication : photo / texte → formulaire, contrôle du titre, modération, doublons, photo de preuve dans le fil (Matteo) | FAIT : **testé en vrai avec Gemini** en local (clé de Matteo) ; **reste à ajouter `GEMINI_API_KEY` sur Vercel (Sacha)** + redéployer |
| 7 | Votes 👍/👎 + score de fiabilité | FAIT (Justin) : boutons de vote sur la fiche + score de fiabilité ; à signaler à Anne-Lise ; **pas testé sur la vraie base** |
| 8 | Favoris ❤️ | FAIT (Anne-Lise) : bouton cœur sur `DealCard`, page `/favoris` regroupée par catégorie, chaque catégorie repliable (mémorisé sur l'appareil) et triée par échéance dans le groupe. Relookage « plus pro » (voir `DECISIONS.md`). Build + lint OK ; **pas testé dans un navigateur ni sur la vraie base** (aucun outil de navigateur ni script contre la vraie BDD disponible dans cette session) |
| 9 | Préférences : parcours d'inscription personnalisé + fil « Pour toi » (repris de Matteo, avec son accord) | EN COURS (Sacha) : codé, voyages ajoutés ; 004 appliquée ; **migration 006 à exécuter** puis test sur la vraie base |
| 10 | Accès 7 jours après contribution + niveaux + messages d'encouragement (page `/profil` : préférences, mes bons plans, audience) | FAIT (Justin, page `/profil`) : accès, niveau, encouragements, préférences, mes bons plans et audience ; **migration 007 à exécuter** puis test réel |
| 11 | Notif sur place simulée (« toujours dispo ? ») | TODO |
| 12 | Données de démo (vrais bons plans Bruz / Ker Lann / Rennes) | EN COURS (Justin) : `supabase/reset_demo.sql` prêt, **à exécuter** ; revérifier les prix avant la démo |
| 13 | Espace commerçant : inscription, offres officielles, retrait, statistiques, mise en avant (`/commercant`) | EN COURS (Justin) : codé ; **migration 005 à exécuter** puis test sur la vraie base |
| 14 | Rappels de dates limites | TODO |
| 15 | Pitch / slides (modèle économique commerçants) | TODO |
| 17 | Profil, ajouts : compte et sécurité, mes données (RGPD), autorisations, crédits (sur la page construite par Justin) | EN COURS (Sacha) : sécurité du compte et confidentialité codées (`/compte`, `/confidentialite`), **migration 009 à exécuter** puis test réel ; crédits et badges à faire |
| 16 | Offres immatérielles (réductions SNCF, aides) : rubrique « Réductions & aides » sur l'accueil | TODO — validée, **intégrée à la tâche 26** |
| 18 | [Lot A] % de compatibilité remplacé par le % de fiabilité sur les cartes | TODO |
| 19 | [Lot B] Carte : enlever les cercles en pointillés des zones | TODO |
| 20 | [Lot C] 1re connexion : « Me localiser » + menu pays → ville-campus | TODO |
| 21 | [Lot C] Inscription : une question « fréquence de voyage » + moyens | TODO |
| 22 | [Lot C] Inscription : « Boursier ? » à la place des choix Carte Sortir et Bourses (migration 010) | TODO |
| 23 | [Lot A] Menu carte : enlever la barre du haut | TODO |
| 24 | [Lot B] Carte : un seul bouton « revenir à ma localisation » (plus de Tout / Bruz / Ker Lann / Rennes) | TODO |
| 25 | [Lot A] « Pour toi » → bascule auto sur « Tout » si catégorie hors profil | TODO |
| 26 | [Lot A] Accueil simple (résumé + réductions) et carte dans un onglet « Recherche » | TODO |
| 27 | [Lot D] Publication : relecture IA remplacée par une recherche de doublon sans IA (« Bon plan validé ») | TODO |

## 🆕 Modifications demandées (tâches 18 à 27) — cadrées par Justin le 27/11, aucun code écrit
**Toutes libres.** Avant de coder : mettre `EN COURS (prénom)` dans le tableau et pousser. **Prendre un lot entier** (les tâches d'un lot touchent les mêmes fichiers). Les règles de CLAUDE.md (questions avant de coder) restent valables.

### Lot A — accueil, recherche, fil (`src/app/page.tsx`, `NavBar.tsx`, `DealCard.tsx`)
- **26 Accueil** : page simple avec les 3 meilleures offres « Pour toi » (`rankDeals`), une entrée vers la recherche et une rubrique « Réductions & aides » (offres `scope !== "local"`, voir tâche 16). Nouvel onglet **« Recherche »** avec la carte ; NavBar : Accueil / Recherche / Partager / Favoris / Profil. *À confirmer* : onglets « Pour toi » / « Tout », filtres et liste complète dans « Recherche ».
- **18 Score** : retirer le % de compatibilité affiché en haut à droite des cartes et mettre **au même endroit le % de fiabilité** (`reliability(votes)`, `rules.ts`). La compatibilité continue de trier « Pour toi ». Les votes sont déjà chargés par `useDeals` (`votes(*)`, à ajouter au type ; vérifier les favoris). Pas de `Date.now()` pendant le rendu. *À confirmer* : affichage quand il n'y a aucun vote.
- **23 Barre du haut** : sur l'écran de la carte, enlever la barre « logo + ShareWood » (interprétation : les boutons de zone relèvent de la tâche 24).
- **25 Bascule** : sur « Pour toi », choisir une catégorie absente du profil passe automatiquement sur « Tout » (sinon la liste est vide).

### Lot B — carte (`src/components/map/DealsMap.tsx`)
- **19** : supprimer les cercles en pointillés des zones (garder le point bleu et le cercle de précision GPS).
- **24** : supprimer les boutons « Tout / Bruz / Ker Lann / Rennes » ; un seul bouton qui revient à la **position GPS**, ou à défaut à la **localisation choisie** à l'inscription (`homeZoneId`).

### Lot C — inscription (`PreferencesWizard.tsx`, `matching.ts`, `preferences.ts`)
- **20** : étape lieu = bouton « Me localiser » **et** menu Pays → Ville-campus. Choix : France → Rennes, Bruz, Ker Lann (zones actuelles, pas de migration). *À confirmer* : garder « Aussi des bons plans de… ».
- **21** : remplacer « Tu rentres chez tes parents ? » et « Envie de voyager ? » par **« Tu voyages à quelle fréquence ? »** (Souvent / Parfois / Rarement), puis les moyens (train, avion, bus, covoiturage). Réutiliser la colonne `home_visits` (pas de migration) ; adapter `isTraveler`, les raisons de `matching.ts` et le récapitulatif.
- **22** : retirer **Carte Sortir et Bourses & aides** des choix de catégories à l'inscription, demander **« Boursier : oui / non »** ; la réponse sert à proposer les offres d'aides. Les deux catégories restent pour les offres, filtres et publication. **Migration 010** (colonne dans `preferences` + GRANT), `schema.sql`, `confidentialite/page.tsx` et export des données à mettre à jour.

### Lot D — publication (`PublishForm.tsx`, `lib/ai/*`, `api/assist/route.ts`)
- **27** : **garder le pré-remplissage IA** (photo / texte) et la photo de preuve ; **supprimer la relecture IA** avant publication (titre, modération, doublon). La remplacer par une recherche de doublon **sans IA** (même catégorie, même lieu ou zone, titre / prix proches). Si une offre ressemble, **l'étudiant choisit** : « C'est la même » → vote 👍 sur l'existante + message **« Bon plan validé »** (pas de second bon plan) ; « Non, publier la mienne » → publication normale. Mettre à jour la mention IA (`AssistPanel`, confidentialité). Conséquence : plus de modération automatique. Prévoir le cas où l'offre trouvée est la sienne (pas de vote sur son propre bon plan).

## Pour démarrer sa tâche
Chaque page a un fichier vide avec un commentaire `// Responsable` + `// TODO` : partir de là. Règles partagées dans `src/lib/rules.ts`, types dans `src/lib/types.ts`, catégories et zones dans `src/lib/constants.ts`.

## Planning indicatif (deadline sam. 28/11 13h00)
- **Ven. après-midi** : stack, squelette, BDD, déploiement
- **Ven. soir** : fonctionnalités MVP (liste, publication, votes)
- **Sam. matin** : carte, données de démo, polish UI
- **Sam. 11h–13h** : gel du code, pitch, répétition

## À prendre en compte (depuis les préférences)
- **Tous** : lancer dans Supabase → SQL Editor `supabase/migrations/006_travel.sql` (004 déjà appliquée), puis `supabase/seed_demo.sql` (exemples fictifs, 2 trajets ajoutés ; ne remplace pas la tâche 12).
- **Matteo (publication)** : `price_level` et `tags` sont bien remplis ✅. Pour les transports, la sous-catégorie (train, avion…) sert à proposer le bon plan aux bons voyageurs.
- **Matteo (tâche 10)** : ajouter dans `/profil` un lien « Mes préférences » vers `/onboarding`. `usePreferences()` donne le profil et les préférences.
- **Justin** : `DealsMap.tsx` modifié (démontage quand la page est cachée, sinon plantage au retour ; prop `homeZoneId` = vue par défaut sans GPS).
- **Sacha (de Justin)** : carte restylée et fusionnée avec tes changements (zone par défaut, démontage de la page cachée conservés) ; `src/app/page.tsx` inchangé. Faire `npm install` après le pull.

## À prendre en compte (depuis l'espace commerçant)
- **Tous** : lancer `supabase/migrations/005_merchant.sql` dans le SQL Editor.
- **Sacha** : `src/app/page.tsx` (offres sponsorisées triées en tête) et `DealCard.tsx` (badge « Sponsorisé ») modifiés par Justin.
- **Matteo (tâche 6)** : le formulaire commerçant est séparé (`components/merchant/OfferForm.tsx`) ; `/publier` reste à toi (ne pas envoyer `boosted_until` ni `ended_by`, non écrivables).
- **Matteo** : bouton « Se déconnecter » (`LogoutButton`) ajouté en bas de `/profil` par Justin : à conserver en construisant la page.
- **Tous** : un compte commerçant ne voit plus les pages étudiantes (`RoleGate`) ; tester vos pages avec un compte étudiant.
- **Anne-Lise (tâches 7, 8)** : les statistiques commerçant restent à zéro tant que les votes et favoris ne sont pas enregistrés (tables `votes`, `favorites`).

## 💡 Homepage et offres immatérielles (de Sacha, pour Anne-Lise — à valider avant de coder)
- Les réductions utiles à un étudiant (cartes et tarifs jeunes SNCF, bourses, Carte Sortir…) n'ont pas de lieu : les montrer à part de la carte.
- **Aucune migration pour les distinguer** : immatériel = `deal.scope !== "local"` (« Sur une zone » / « Partout » dans `/publier`).
- Rubriques déduites de `category` : 🚆 Voyager (transport) · 🎓 Aides & bourses (scholarship) · 🎟️ Culture & sport (carte_sortir, sport, activity) · 🛒 Quotidien (restaurant, supermarket).
- Homepage proposée : 3 meilleurs « Pour toi » (`rankDeals`), puis deux entrées « 📍 Autour de moi » (carte) et « 💳 Réductions & aides ».
- ⚠️ `src/app/page.tsx` contient la carte, le fil « Pour toi » et les favoris : prévenir Sacha avant de le déplacer.

## À prendre en compte (depuis le profil)
- **Tous** : lancer `supabase/migrations/007_engagement.sql` (vues et « J'y suis allé »).
- **Anne-Lise** : votes faits (`components/deal/DealSheet.tsx`) ; `DealCard` ouvre désormais cette fiche (cœur favori inchangé).
- **Matteo** : `/profil` est construit ; reste la tâche 11 (« Simuler ma position »).
- **Sacha** : le parcours accepte `/onboarding?etape=<id>` (une seule rubrique, bouton « Enregistrer », retour au profil).

## À prendre en compte (depuis la photo de preuve, Matteo)
- **Tous** : lancer `supabase/migrations/008_deal_photos.sql` dans le SQL Editor (colonne `deals.photo_url` + stockage `deal-photos`). Sans elle, les bons plans sont publiés sans photo.
- **Sacha** : `src/components/feed/DealCard.tsx` modifié par Matteo (miniature de la photo de preuve + affichage en grand), à conserver.

## Profil, ajouts (tâche 17, cadrage)
- À prévoir : mot de passe et déconnexion de tous les appareils · export et suppression du compte · information sur les données (dont envois à l'IA et à Photon) · position enregistrée effaçable · crédits calculés par la base, avec règles anti-abus.
- Justin / Matteo : prévenir Sacha avant de modifier `/profil` ; les ajouts viseront des sous-pages pour limiter les conflits.

## Refonte visuelle complète (Anne-Lise, 18h30)
- **Toutes** les pages et composants ont été restylés d'un coup (voir `DESIGN_SHAREWOOD.md` + `DECISIONS.md`) : polices, couleurs, `CategoryIcon`, icônes `icons.tsx`, et **suppression de tous les emoji** de l'app. **Changement uniquement visuel** : aucune logique, donnée, route ni appel Supabase n'a été touché — vos tâches en cours restent valables, seul l'habillage a changé sous vos pieds.
- Si vous aviez un emoji ou une couleur `blue-`/`zinc-` codée en dur sur une page en cours de modification chez vous : regardez comment les fichiers voisins ont été convertis (ex. `PublishForm.tsx`, `page.tsx`) pour rester cohérent plutôt que de revenir à l'ancien style.
- `npx tsc --noEmit`, `npm run lint`, `npm run build` : tous OK après la refonte.

## À prendre en compte (depuis le relookage « plus pro »)
- **Tous** : nouveau fichier `src/components/icons.tsx` (icônes sobres en SVG, pas d'emoji) ; à réutiliser si vous retirez des emoji sur vos pages. `NavBar.tsx` et `DealCard.tsx` (fichiers partagés) ont été modifiés **uniquement visuellement** (icônes à la place des emoji) : aucun lien, route ou comportement changé.
- **Périmètre volontairement pas touché** (pour ne pas marcher sur votre travail en cours) : pins et commandes de la carte (Justin), `/commercant` et `/profil` (Justin), `/publier` et `/onboarding` (Matteo/Sacha), emoji de `TRANSPORT_MODES` / `BUDGET_PROFILES` dans `constants.ts` (Sacha). Dites-moi si vous voulez que j'harmonise ces pages avec `icons.tsx` ou si vous préférez vous en charger.
- **Sacha (tâche 16, homepage)** : toujours en attente de validation, pas de conflit avec ce qui a été fait ici.
- **Justin** : `src/app/profil/page.tsx` (lien « Partager un bon plan ») et `components/profile/ActivityCard.tsx` (« partagé », « Partages-en un ») modifiés par Matteo (renommage Signaler → Partager).

## À prendre en compte (depuis le compte et la confidentialité, Sacha)
- **Tous** : lancer dans l'ordre `007_engagement.sql`, `008_deal_photos.sql`, `009_account.sql` (celles pas encore passées). Ensuite, si 007 est relancée, relancer 009.
- **Tous** : `deals.author_id` peut être `null` (compte supprimé) ; les profils des autres ne sont plus lisibles. Toute nouvelle donnée ou tout nouveau service externe → mettre à jour `src/app/confidentialite/page.tsx`.
- **Justin** (accord donné) : lien vers `/compte` dans `/profil` et `/commercant/compte` ; `deleteMyDeal` efface aussi la photo ; `reset_demo.sql` efface les bons plans avant les comptes → **refaire ta copie `*.local.sql`**.
- **Matteo** : dans `/publier`, la photo n'est publiée que si la case est cochée ; mention de l'IA ajoutée dans `AssistPanel`.
- **Anne-Lise** : `NavBar` masquée aussi sur `/confidentialite`.
- À remplir : `PRIVACY_CONTACT` (`src/lib/constants.ts`) pour afficher un contact.