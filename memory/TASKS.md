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
| 6b | Assistant IA de publication : photo / texte → formulaire, contrôle du titre, modération, doublons (Matteo) | FAIT : **testé en vrai avec Gemini** en local (clé de Matteo) ; **reste à ajouter `GEMINI_API_KEY` sur Vercel (Sacha)** + redéployer |
| 7 | Votes 👍/👎 + score de fiabilité | FAIT (Justin) : boutons de vote sur la fiche + score de fiabilité ; à signaler à Anne-Lise ; **pas testé sur la vraie base** |
| 8 | Favoris ❤️ | FAIT (Anne-Lise) : bouton cœur sur `DealCard`, page `/favoris` regroupée par catégorie (triée par échéance dans chaque groupe). Build + lint OK ; **pas testé dans un navigateur ni sur la vraie base** (aucun outil de navigateur ni script contre la vraie BDD disponible dans cette session) |
| 9 | Préférences : parcours d'inscription personnalisé + fil « Pour toi » (repris de Matteo, avec son accord) | EN COURS (Sacha) : codé, voyages ajoutés ; 004 appliquée ; **migration 006 à exécuter** puis test sur la vraie base |
| 10 | Accès 7 jours après contribution + niveaux + messages d'encouragement (page `/profil` : préférences, mes bons plans, audience) | FAIT (Justin, page `/profil`) : accès, niveau, encouragements, préférences, mes bons plans et audience ; **migration 007 à exécuter** puis test réel |
| 11 | Notif sur place simulée (« toujours dispo ? ») | TODO |
| 12 | Données de démo (vrais bons plans Bruz / Ker Lann / Rennes) | TODO |
| 13 | Espace commerçant : inscription, offres officielles, retrait, statistiques, mise en avant (`/commercant`) | EN COURS (Justin) : codé ; **migration 005 à exécuter** puis test sur la vraie base |
| 14 | Rappels de dates limites | TODO |
| 15 | Pitch / slides (modèle économique commerçants) | TODO |
| 16 | Offres immatérielles (réductions SNCF, aides, Carte Sortir) : rubrique « Réductions & aides » reliée à la homepage | TODO — 💡 proposition à valider (Sacha + Anne-Lise) |

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
