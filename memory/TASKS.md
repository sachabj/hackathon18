# TASKS — état du projet et qui fait quoi

_Réécrit le 28/11 à partir de la lecture du code (tâche 74, Justin). Historique : `JOURNAL.md`. Les numéros de tâche sont conservés._

Statuts : `TODO` · `EN COURS (prénom)` · `À TESTER` (codé, pas essayé sur la vraie base) · `FAIT` · `BLOQUÉ (raison)`

**Avant de coder** : mettre `EN COURS (prénom)` ici et pousser ; poser les questions prévues par `CLAUDE.md`.

## 🚀 Mise en ligne (à la demande, voir `CLAUDE.md`)
- **Dernier déploiement : `fa25bd5`, 28/11 à 10h08** (Justin) → **https://sharewood-ensai.vercel.app** (site à utiliser pour la démo) : + icônes Lucide, logo animé, lien « lieu d'études » (Sacha), derniers textes traduits. Peut servir de déploiement final si aucun code n'est poussé avant 11h.
- Ancien site `hackathon18-t1lb` : figé sur `4b716f5`.

## Équipe (domaines)
| Membre | Domaine |
|---|---|
| Justin | Squelette, base, déploiement, carte, votes, profil, commerçants, données de démo |
| Sacha | Fil « Pour toi », préférences, compte et confidentialité, Flèches |
| Matteo | Publication, assistant IA, photo de preuve, fiabilité |
| Anne-Lise | Favoris, design |

---

## 1. ✅ Déjà fait (vérifié dans le code)
Présent dans le code au 28/11 ; types, lint et build passent. La colonne « À essayer en vrai » reprend les anciens `À TESTER`.

| Domaine | Ce qui est codé (tâches) | Qui | À essayer en vrai |
|---|---|---|---|
| Socle | Mémoire et git, stack, déploiement, base et droits (1 à 4) | Justin | en ligne |
| Accueil | Puces « Pour toi », « Mes favoris » et catégories cumulables, sans formule d'accueil ; puce « Plus proches » (position du moment, sinon enregistrée, sinon ville ; offres sans lieu à la fin, pas de priorité aux offres mises en avant) (26, 39, 67, 79) | Sacha, Matteo | 67 et 79 pas vus dans un navigateur |
| Recherche | Fautes, pluriels, mots proches, filtres et tri, « pas cher » / « près de moi » ; offre touchée dans la liste : fiche ouverte et carte centrée dessus (34, 36, 80) | Sacha, Anne-Lise | clavier du téléphone |
| Carte | Position avec accord, repères, offres sponsorisées, recentrage, zoom + et − (5, 19, 23, 24, 61) | Justin | téléphone |
| Cartes et fiche | Fiabilité en couleur, réactions directes, photo, petit lien sous la description (80), conditions, « Y aller », « Partager », badges Commerçant / Étudiant (28, 30, 35, 37, 38) | Matteo, Justin, Sacha | 35 et 38 pas vus dans un navigateur |
| Publication | Lieu via Photon, saisie rapide, photo ou texte → formulaire (Gemini ou Claude), photo de preuve, doublons sans IA avec « Voir l'offre » / « Voir mon bon plan » (6, 27, 45, 78) | Matteo, Justin | publication et Gemini essayés (Matteo) ; photo affichée, appareil photo, nouvel écran avec la vraie IA |
| Réactions et fiabilité | « J'en ai profité » / « Plus dispo », poids des étudiants, tri Hot, sur place à 500 m, « Douteux » puis retrait, jamais sur ses offres (7, 29, 32, 33, 51, 58, 66, 69) | Matteo, Sacha, Justin | 29, 33, 51, 69 |
| Inscription | Me localiser ou recherche de **n'importe quelle ville de France** (+ 4 villes suivies), transports, voyages, budget, bourse, Carte Sortir (région rennaise seulement), priorités, « Pour toi » (9, 20, 21, 22, 52, 54) | Sacha, Justin | vraie base et téléphone |
| Langue | Français / anglais : parcours étudiant, assistant de préférences, espace commerçant et messages d'erreur de la base ; choix au profil et sur la connexion, retenu sur l'appareil ; seule la politique de confidentialité reste en français (50, S6) | Sacha, Justin | téléphone ; changement de langue côté commerçant |
| Favoris | Par catégorie, dans « Ciblés » (8) ; cœur aussi dans la fenêtre d'un repère et la fiche, synchronisé partout (77) | Anne-Lise | vraie base |
| Ciblés | Flèches, grades, activité, mes bons plans, boutique et bons à QR code ; aucun accès limité (10, 17b, 42, 43, 44, 46, 47) | Sacha | testé en local seulement |
| Écoles | Compétition entre écoles : école choisie dans une liste, classement dans « Ciblés » (70), lien « Choisis ton lieu d’études » toujours affiché, vers Profil > Informations personnelles (81) | Justin | 028 et écoles de démo lancées ; à voir sur téléphone |
| Signalement | « Signaler ce bon plan » en bas de la fiche (5 motifs), offre masquée pour son auteur, table `deal_reports` (71, migration 029 lancée) | Matteo | pas vu dans un navigateur ni sur téléphone |
| Notifications | Dans l'appli ouverte : « Bons plans à proximité » (150 m, réglable), « mes offres confirmées » à l'ouverture ; interrupteurs du profil actifs (68) | Justin | à voir sur téléphone |
| Profil | Étudiants aidés, parrainage, menu des réglages, localisation retirable, aide et bug (49, 64, 68) | Sacha, Justin | vraie base |
| Compte | Mot de passe, appareils, export, suppression, politique de confidentialité (17a) | Sacha | vraie base |
| Commerçant | Offres, retrait, statistiques, offres d'étudiants voisines ; mise en avant payée à l'écran (9,90 €, simulé) avec reçu et « Mes paiements » (13) | Justin | paiement essayé sur le site (Justin, 28/11) ; reste à voir sur téléphone |
| Ordinateur | Navigation en haut, liste et carte côte à côte, colonnes (48) | Justin | vu avec un faux Supabase seulement |
| Documentation | `docs/ALGORITHMES.md` (40), `README.md`, revue du dépôt (74) ; check global du 28/11 à 10h (contrôles, 28 écrans, vrai site avec les comptes de démo) | Matteo, Justin | — |
| Vidéo de démo | `pitch/demo-16x9.mp4` et `demo-telephone.mp4` (40 s, données d'exemple, sans son) ; retournage : `pitch/video/tourner.sh` ; **vidéo promo 9:16 de 59 s** `pitch/sharewood-promo.mp4` (kit `pitch/promo/`, 28/11 à 10h45) | Justin | à regarder par l'équipe |
| Données de démo | Sur la vraie base : 20 étudiants, 12 commerces fictifs, ~150 offres, Flèches de démo ; prix des 14 offres sourcées revérifiés le 28/11 vers 6h, aucun écart (12) | Justin | — |
| Vraies offres | 54 offres importées (événements, aides, Intermarché) et offre Burger King (`import_burgerking.sql`, lancé), badge « Source officielle » ; aucune offre étudiante officielle trouvée pour McDonald's, Carrefour, Super U, Auchan (65) | Justin | voir l'offre Burger King sur le site |
| Tombola, Avant-Première | Tirage par SQL (`draw_raffle`), résultat sur le ticket ; offre flash du commerçant visible 1 h avant par les détenteurs (42) | Justin | offre flash et tirage essayés sur le site (Justin, 28/11) |
| Reset démo | `node scripts/build_demo_sql.mjs` : un seul fichier SQL pour remettre la démo à zéro, offres inventées réduites à 38 sur 107 (`reduce_demo.sql`) | Justin | pas lancé sur la vraie base |
| Défauts | D3 à D5, D7 à D9, D11 à D14 (76) | Justin | essayés sur téléphone (C3) |
| Tâches importantes | Notification sur place simulée (11), « Sport » (55), même gain des réactions (57, migration **026**), carte qui suit la recherche (60), offre publiée montrée (62) | Justin | vraie base et téléphone |
| Animations | Micro-animations des réactions, de la fiche, des listes et des favoris (75) ; logo animé à l’ouverture, 1,2 s (82) | Matteo | pas vues dans un navigateur ni sur téléphone |
| Icônes | Bibliothèque Lucide pour les choix (inscription, préférences), les conditions, les activités et les catégories, partout dans l’appli (53) ; `npm install` après le pull | Sacha | téléphone |

Tâches remplacées : 16 (dans 26), 18 (par 30), 25 et 31 (puis 67), 56 (par 67), 63 (par 68). Défauts corrigés avant la revue : D1 (vote sur son offre), D2 (copie locale du script de démo), D6 (lecteurs d'écran), D10 (tuile choisie).

## 2. 🟡 En cours / Partiel
| # | Sujet | Ce qui existe | Ce qui manque | Qui |
|---|---|---|---|---|
| 15 | Pitch | 6 diapos LaTeX (`pitch/`, diapo Erasmus retirée le 28/11), diapo 1 : le paradoxe « Hyperconnectés, mais mal informés » en deux colonnes (Matteo, remplace la version d'Anne-Lise), diapo 3 avec 3 boucles vidéo intégrées au PDF, lancées **au clic** (boutons lecture/pause par téléphone, pas d'autoplay simultané) (téléphones agrandis, recherche carte+barre / partager / récompenses, `\phonevideo`, paquet `animate`), ancienne vidéo de 40 s (`pitch/demo-16x9.mp4`) gardée en repli | PDF recompilé le 28/11 vers 8h30 (Matteo, Tectonic) ; diapo 3 à corriger (C3b) ; vérifier le rendu diapo 1 et que les 3 boutons de la diapo 3 apparaissent et lancent bien chaque vidéo **dans Adobe Acrobat Reader** ; répétition (C4) | équipe |

## 3. 📋 Reste à faire

### 🔴 Critique (deadline : samedi 28/11 à 13h ; gel du code à 11h)
| # | Action | Qui |
|---|---|---|
| C9 | **Remettre la démo dans son état de départ juste avant de présenter** : sur le site, demo.sarah est à 495 Flèches et « Expos gratuites » est déjà confirmée (scénario joué en répétition), et la base a encore toutes les offres inventées. `node scripts/build_demo_sql.mjs` puis lancer `demo_complet.local.sql` (⚠️ reset : vérifier avant la liste des comptes gardés) ; sinon, au minimum `seed_arrows.sql` | Justin |
| C11 | Retirer les 300 Flèches de test données à un compte par Matteo (ligne `welcome` dans `arrow_events`), sinon elles faussent le classement des écoles | Matteo |
| C3b | **Diapo 3 du pitch** (vue dans le PDF recompilé le 28/11 vers 8h30) : les boutons lecture/pause des 3 vidéos sortent du bas de la page et se chevauchent ; « Une offre en quelques secondes » passe sur 2 lignes et touche le téléphone | Anne-Lise |
| C4 | **Répéter le pitch** ; ouvrir le PDF avec **Adobe Acrobat Reader installé** et vérifier que les 3 boucles vidéo de la diapo 3 jouent (sinon, lancer `pitch/demo-16x9.mp4` à la place, 40 s sans son : préparer le commentaire) ; **préparer les réponses aux questions probables du jury** (prix de la mise en avant absent de la diapo 5, différence avec Dealabs / UNiDAYS, démarrage à vide, triche et faux comptes, part d'offres réelles) | équipe |
| C5 | Gel du code à 11h, dernier déploiement | Justin |

### 🟢 Bonus
| # | Tâche | Taille | Statut |
|---|---|---|---|
| 14 | Rappels de dates limites | M | TODO |
| 41 | Filtre « Ouvert maintenant » : aucune donnée d'horaires (saisie + migration, ou service externe) | M | TODO, remis à plus tard (Sacha) |
| 59 | Récompense de publication différée (délai et nombre d'étudiants à choisir) ; migration ; aujourd'hui +50 sur place, +20 sans lieu | M | TODO (Sacha) |
| 68b | « Précisions sur une offre » (refonte du profil) : idée à préciser par l'équipe (ex. courtes précisions d'étudiants sous une offre ; migration et modération) | M | TODO (non cadrée) |
| 72 | **Alertes** « préviens-moi quand une offre correspond à… » : prototype web = alertes enregistrées, vérification à l'ouverture et en direct (Supabase Realtime), notification du navigateur appli ouverte ; vrai push hors délai | M à G | TODO (idée retenue par Matteo, non cadrée) |
| 73 | **Manifest (PWA installable)** : « Ajouter à l'écran d'accueil », plein écran, icône ; aucun manifest aujourd'hui ; nécessaire aux notifications sur iPhone | P | TODO (idée retenue par Matteo, non cadrée) |

## 4. 🚢 Mise en service (hors périmètre pour l'instant)
Le but actuel est la démo, **pas la mise en service** : ne rien commencer ici sans décision de l'équipe.

| # | Tâche | Origine |
|---|---|---|
| S1 | Vrai paiement de la mise en avant (prestataire, mentions légales, factures) à la place du paiement simulé | 13 |
| S2 | Vérifier le statut de commerçant (SIRET) avant de publier des offres « officielles » | 13 |
| S3 | Vrais partenaires pour la boutique ; bon validable seulement par le partenaire concerné | 42 |
| S4 | Vraie adresse de contact (`PRIVACY_CONTACT`, aujourd'hui fictive) | 17a |
| S5 | Relecture juridique de la politique de confidentialité (RGPD) | 17a |
| S6 | Politique de confidentialité en anglais | 50 |
| S7 | Réactiver la confirmation par email ; mot de passe oublié et changement d'email | comptes |
| S8 | Anti-triche : position falsifiable, faux comptes (votes, retraits, parrainage, « étudiants aidés ») | limites |
| S9 | Remplacer les données de démo (commerces fictifs, offres inventées) par des données réelles | 12 |
| S10 | Dette technique : code de secours des migrations, seuils écrits en TypeScript et en SQL (`ARCHITECTURE.md`) | revue |

## 5. 🐞 Défauts ouverts
**Aucun.** Un défaut trouvé s'ajoute ici (numéro D15, D16…, priorité, qui s'en charge), puis disparaît une fois corrigé.

Contrôles, variables d'environnement, état de la vraie base, limites et dette technique : `ARCHITECTURE.md`, « Vérifications, base et limites ».

Règles à connaître avant de modifier le code : `ARCHITECTURE.md`, « Règles avant de modifier le code ».
