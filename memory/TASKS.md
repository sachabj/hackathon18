# TASKS — qui fait quoi

Statuts : `TODO` · `EN COURS (prénom)` · `À TESTER` (codé, pas essayé sur la vraie base) · `FAIT` · `BLOQUÉ (raison)`

_Mis à jour le 27/11 après relecture de tout le code (lint : 1 avertissement connu dans `LogoutButton` ; build OK). L'historique est dans `JOURNAL.md`._

**Avant de coder** : mettre `EN COURS (prénom)` ici et pousser ; poser les questions prévues par `CLAUDE.md`.

## Base de données
- Migrations **004 à 009 présentes sur la vraie base** (tables, colonnes et fonction 009 détectées via l'API le 27/11 ; stockage `deal-photos` répond). Rien à exécuter pour le code actuel.
- Prochaine migration : numéro **010** (le premier qui en crée une le prend ; vérifier après un pull). Toute modification : fichier dans `supabase/migrations/` + `schema.sql` + GRANT, puis la faire lancer dans le SQL Editor.

## Équipe (domaines actuels)
| Membre | Domaine |
|---|---|
| Justin | Squelette, base, déploiement, carte, votes, profil, commerçants, données de démo |
| Sacha | Fil « Pour toi », préférences, compte et confidentialité |
| Matteo | Publication, assistant IA, photo de preuve |
| Anne-Lise | Favoris, design |

## 🔴 À faire en priorité : modifications demandées (18 à 27)
Lots A, B et C **libres**, lot D pris par Matteo. **Prendre un lot entier** : ses tâches touchent les mêmes fichiers.

| # | Lot | Tâche | Statut |
|---|---|---|---|
| 18 | A | % de compatibilité remplacé par le % de fiabilité sur les cartes | TODO |
| 23 | A | Menu carte : enlever la barre du haut | TODO |
| 25 | A | « Pour toi » → bascule auto sur « Tout » si catégorie hors profil | TODO |
| 26 | A | Accueil simple (résumé + réductions) et carte dans un onglet « Recherche » (inclut l'ancienne tâche 16) | TODO |
| 19 | B | Carte : enlever les cercles en pointillés des zones | TODO |
| 24 | B | Carte : un seul bouton « revenir à ma localisation » | TODO |
| 20 | C | 1re connexion : « Me localiser » + menu pays → ville-campus | TODO |
| 21 | C | Inscription : une question « fréquence de voyage » + moyens | TODO |
| 22 | C | Inscription : « Boursier ? » à la place des choix Carte Sortir et Bourses (migration) | TODO |
| 27 | D | Publication : relecture IA remplacée par une recherche de doublon sans IA | EN COURS (Matteo) |

### Lot A — accueil, recherche, fil (`app/page.tsx`, `NavBar.tsx`, `DealCard.tsx`)
- **26** : accueil = 3 meilleures offres « Pour toi » (`rankDeals`), une entrée vers la recherche et une rubrique « Réductions & aides » (`scope !== "local"` ; rubriques possibles d'après `category` : Voyager = transport, Aides = scholarship, Culture & sport = carte_sortir / sport / activity, Quotidien = restaurant / supermarket). Nouvel onglet **« Recherche »** avec la carte ; barre du bas : Accueil / Recherche / Partager / Favoris / Profil.
  - Ajouter la nouvelle route à `STUDENT_PATHS` (`RoleGate.tsx`) ; dans `NavBar`, `/` ne doit être actif que sur l'adresse exacte (déjà le cas).
  - Le bouton « Voir sur la carte » après publication (`PublishForm`, fichier du lot D) pointe vers `/` : prévenir Matteo pour le rediriger.
  - Garder les offres sponsorisées en tête.
  - *À confirmer* : « Pour toi » / « Tout », filtres et liste complète dans « Recherche » ; contenu de l'accueil pour un étudiant sans préférences.
- **18** : retirer le % de compatibilité en haut à droite des cartes (`DealCard`, affiché si `match.forYou`) et mettre **au même endroit le % de fiabilité** (`reliability(votes)`, `rules.ts`). La compatibilité continue de trier « Pour toi ».
  - `useDeals` charge déjà `votes(*)` : l'ajouter au type renvoyé. `/favoris` fait `select("*")` : ajouter `votes(*)`.
  - Pas de `Date.now()` pendant le rendu (dater au chargement). Voir le défaut D4.
  - *À confirmer* : affichage quand il n'y a aucun vote (`score === null`).
- **23** : enlever la barre « logo + ShareWood » de l'écran de la carte (interprétation à confirmer ; les boutons de zone relèvent de la tâche 24).
- **25** : sur « Pour toi », choisir une catégorie absente du profil passe sur « Tout ». *À noter* : des trajets peuvent être dans « Pour toi » sans que « Transports » soit suivi.

### Lot B — carte (`components/map/DealsMap.tsx`)
- **19** : supprimer les `Circle` en pointillés des zones (garder le point bleu et le cercle de précision GPS). `ZONES` reste utile pour la vue par défaut.
- **24** : supprimer les boutons « Tout / Bruz / Ker Lann / Rennes » ; un seul bouton revient à la **position GPS**, sinon à la **localisation choisie** (position enregistrée par « Me localiser » si elle existe, sinon centre de `homeZoneId` ; aujourd'hui seule la zone est passée à la carte). Réduire ensuite la marge haute des fiches (`autoPanPaddingTopLeft`). Conserver le démontage de la carte quand la page est cachée.

### Lot C — inscription (`PreferencesWizard.tsx`, `matching.ts`, `preferences.ts`, `PreferencesSummary.tsx`)
- **20** : étape lieu = bouton « Me localiser » **et** menu Pays → Ville-campus : France → Rennes, Bruz, Ker Lann (pas de migration). *À confirmer* : garder « Aussi des bons plans de… ».
- **21** : remplacer les deux questions par **« Tu voyages à quelle fréquence ? »** (Souvent / Parfois / Rarement), puis les moyens. Réutiliser `home_visits` ; la colonne `wants_travel` reste en base mais n'est plus demandée. ⚠️ `isTraveler` l'utilise, et les moyens ne sont enregistrés que si `isTraveler` : décider quoi faire pour « Rarement ». Adapter les raisons de `matching.ts` et les deux récapitulatifs.
- **22** : retirer Carte Sortir et Bourses & aides **des choix d'inscription** (les catégories restent pour les offres, filtres et publication) ; demander « Boursier : oui / non » et s'en servir pour proposer les aides.
  - Migration (colonne dans `preferences`, mêmes droits), `schema.sql`, `types.ts`, `confidentialite/page.tsx`. L'export et la suppression du compte la prennent en compte automatiquement.
  - ⚠️ Le repli `PGRST204` de `saveMyPreferences` ignorerait la nouvelle colonne sans erreur.
  - ⚠️ Le récapitulatif relie ses lignes aux étapes **par leur position** : garder le même ordre en ajoutant l'étape.
  - Les profils existants (dont les comptes de démo) peuvent déjà suivre ces deux catégories.

### Lot D — publication (`PublishForm.tsx`, `lib/ai/*`, `api/assist/route.ts`) — Matteo
- **27** : **garder le pré-remplissage IA** et la photo de preuve ; **supprimer la relecture IA** (`reviewBeforePublish`, `reviewDeal`, action `review`, titre et modération). Recherche de doublon **sans IA** : `findDuplicateCandidates` existe déjà (même catégorie, ≤ 300 m ou même zone, 60 jours) ; ajouter la proximité du titre / prix. Si une offre ressemble, **l'étudiant choisit** : « C'est la même » → vote 👍 + message **« Bon plan validé »** ; « Non, publier la mienne » → publication.
  - Exclure ses propres bons plans (défaut D1).
  - Mettre à jour `confidentialite/page.tsx` (envoi à l'IA « à la publication »), `.env.example` et le commentaire de la route.
  - Conséquence : plus de modération automatique.

## 🐞 Défauts relevés à la relecture (à prendre, noter son prénom)
Relevés en lisant le code, pas encore reproduits dans l'app.

| # | Priorité | Défaut | Statut |
|---|---|---|---|
| D1 | Haute | **On peut voter sur son propre bon plan** : « C'est le même : je le confirme » ne filtre pas ses offres et la règle `voter` de la base l'autorise → fiabilité gonflée et accès 7 jours relancé à volonté. Corriger dans l'app (avec la tâche 27) **et** par une règle en base (migration) | TODO |
| D2 | Haute (Justin) | La copie locale `supabase/reset_demo.local.sql` de Justin est **périmée** (ne supprime pas les bons plans avant les comptes, depuis la 009) : la refaire à partir de `reset_demo.sql` avant tout lancement | TODO |
| D3 | Moyenne | `/favoris` affiche les bons plans expirés ou retirés sans le signaler | TODO |
| D4 | Moyenne | Après un vote dans la fiche, le fil et la carte ne se rafraîchissent qu'au retour sur la page (`useDeals`) | TODO |
| D5 | Basse | Une erreur d'ajout / retrait de favori n'est affichée nulle part (`useFavorites.error`) | TODO |
| D6 | Basse | `CategoryIcon` annonce l'identifiant anglais (`supermarket`) aux lecteurs d'écran : aucun appel ne passe `label` | TODO |
| D7 | Basse | Longueurs maximales différentes : publication titre 80 / prix 80, modification et offre commerçant 100 / 40 ; aucune limite en base | TODO |
| D8 | Basse | Restes de l'ancien style : `themeColor` bleu (`layout.tsx`), gris `zinc` dans `RoleGate`, `DealsMapLoader`, `BusinessForm` | TODO |
| D9 | Basse | `/api/assist` sans limite par utilisateur (un compte peut épuiser le quota de la clé) | TODO |

## Autres tâches
| # | Tâche | Statut |
|---|---|---|
| 11 | Notif sur place simulée (« toujours dispo ? ») + bouton « Simuler ma position » dans `/profil` | TODO |
| 12 | Données de démo : `reset_demo.sql` prêt (exécution non confirmée), voir D2 ; revérifier les prix avant la démo | EN COURS (Justin) |
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
- Next conserve les pages quittées : les effets sont relancés au retour (cartes Leaflet à démonter).

## Planning (deadline sam. 28/11 13h00)
- **Ven. soir** : tâches 18 à 27, défauts hauts
- **Sam. matin** : tests réels, données de démo, finitions
- **Sam. 11h–13h** : gel du code, pitch, répétition
