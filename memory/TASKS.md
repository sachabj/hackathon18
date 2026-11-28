# TASKS — état du projet et qui fait quoi

_Réécrit le 28/11 à partir de la lecture du code (tâche 74, Justin). Historique : `JOURNAL.md`. Les numéros de tâche sont conservés._

Statuts : `TODO` · `EN COURS (prénom)` · `À TESTER` (codé, pas essayé sur la vraie base) · `FAIT` · `BLOQUÉ (raison)`

**Avant de coder** : mettre `EN COURS (prénom)` ici et pousser ; poser les questions prévues par `CLAUDE.md`.

## 🚀 Mise en ligne (à la demande, voir `CLAUDE.md`)
- **Dernier déploiement : `032885a`, 28/11 à 05h39** (Justin) → **https://sharewood-ensai.vercel.app** (site à utiliser pour la démo) : + validation des bons par le commerçant (42), notifications dans l'appli ouverte (68), signalement de contenu (Matteo, 71).
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
| Accueil | Puces « Pour toi », « Mes favoris » et catégories cumulables, sans formule d'accueil (26, 39, 67) | Sacha, Matteo | 67 pas vu dans un navigateur |
| Recherche | Fautes, pluriels, mots proches, filtres et tri, « pas cher » / « près de moi » ; offre touchée mise en avant sur la carte (34, 36) | Sacha, Anne-Lise | clavier du téléphone |
| Carte | Position avec accord, repères, offres sponsorisées, recentrage, zoom + et − (5, 19, 23, 24, 61) | Justin | téléphone |
| Cartes et fiche | Fiabilité en couleur, réactions directes, photo, lien, conditions, « Y aller », « Partager », badges Commerçant / Étudiant (28, 30, 35, 37, 38) | Matteo, Justin, Sacha | 35 et 38 pas vus dans un navigateur |
| Publication | Lieu via Photon, saisie rapide, photo ou texte → formulaire (Gemini ou Claude), photo de preuve, doublons sans IA avec « Voir l'offre » / « Voir mon bon plan » (6, 27, 45, 78) | Matteo, Justin | publication et Gemini essayés (Matteo) ; photo affichée, appareil photo, nouvel écran avec la vraie IA |
| Réactions et fiabilité | « J'en ai profité » / « Plus dispo », poids des étudiants, tri Hot, sur place à 500 m, « Douteux » puis retrait, jamais sur ses offres (7, 29, 32, 33, 51, 58, 66, 69) | Matteo, Sacha, Justin | 29, 33, 51, 69 |
| Inscription | Me localiser ou recherche de **n'importe quelle ville de France** (+ 4 villes suivies), transports, voyages, budget, bourse, Carte Sortir (région rennaise seulement), priorités, « Pour toi » (9, 20, 21, 22, 52, 54) | Sacha, Justin | vraie base et téléphone |
| Langue | Français / anglais : parcours étudiant traduit (connexion, navigation, accueil, recherche, carte, fiche, publication, Ciblés, profil, localisation) ; choix au profil et sur la connexion, retenu sur l'appareil (50) | Sacha | téléphone |
| Favoris | Par catégorie, dans « Ciblés » (8) ; cœur aussi dans la fenêtre d'un repère et la fiche, synchronisé partout (77) | Anne-Lise | vraie base |
| Ciblés | Flèches, grades, activité, mes bons plans, boutique et bons à QR code ; aucun accès limité (10, 17b, 42, 43, 44, 46, 47) | Sacha | testé en local seulement |
| Écoles | Compétition entre écoles : école choisie dans une liste, classement dans « Ciblés » (70) | Justin | 028 et écoles de démo lancées ; à voir sur téléphone |
| Signalement | « Signaler ce bon plan » en bas de la fiche (5 motifs), offre masquée pour son auteur, table `deal_reports` (71, migration 029 lancée) | Matteo | pas vu dans un navigateur ni sur téléphone |
| Notifications | Dans l'appli ouverte : « Bons plans à proximité » (150 m, réglable), « mes offres confirmées » à l'ouverture ; interrupteurs du profil actifs (68) | Justin | à voir sur téléphone |
| Profil | Étudiants aidés, parrainage, menu des réglages, localisation retirable, aide et bug (49, 64, 68) | Sacha, Justin | vraie base |
| Compte | Mot de passe, appareils, export, suppression, politique de confidentialité (17a) | Sacha | vraie base |
| Commerçant | Offres, retrait, statistiques, offres d'étudiants voisines ; mise en avant payée à l'écran (9,90 €, simulé) avec reçu et « Mes paiements » (13) | Justin | 031 lancée ; **déployer**, puis vraie base et téléphone |
| Ordinateur | Navigation en haut, liste et carte côte à côte, colonnes (48) | Justin | vu avec un faux Supabase seulement |
| Documentation | `docs/ALGORITHMES.md` (40), `README.md`, revue du dépôt (74) | Matteo, Justin | — |
| Vidéo de démo | `pitch/demo-16x9.mp4` et `demo-telephone.mp4` (40 s, données d'exemple, sans son) ; retournage : `pitch/video/tourner.sh` | Justin | à regarder par l'équipe |
| Défauts | D3 à D5, D7 à D9, D11 à D14 (76) | Justin | essayés sur téléphone (C3) |
| Tâches importantes | Notification sur place simulée (11), « Sport » (55), même gain des réactions (57, migration **026**), carte qui suit la recherche (60), offre publiée montrée (62) | Justin | vraie base et téléphone |
| Animations | Micro-animations des réactions, de la fiche, des listes et des favoris (75) | Matteo | pas vues dans un navigateur ni sur téléphone |

Tâches remplacées : 16 (dans 26), 18 (par 30), 25 et 31 (puis 67), 56 (par 67), 63 (par 68). Défauts corrigés avant la revue : D1 (vote sur son offre), D2 (copie locale du script de démo), D6 (lecteurs d'écran), D10 (tuile choisie).

## 2. 🟡 En cours / Partiel
| # | Sujet | Ce qui existe | Ce qui manque | Qui |
|---|---|---|---|---|
| 12 | Données de démo | lancées sur la vraie base (Justin, 28/11) : 20 étudiants, 12 commerces fictifs, ~150 offres, Flèches de démo | revérifier les prix des offres sourcées (avec lien) avant la démo | Justin |
| 65 | Vraies offres | 54 offres importées sur la vraie base (événements, aides, Intermarché), badge « Source officielle » | Burger King, McDonald's, Carrefour, Super U, Auchan non publiés (offres non confirmées) | Justin |
| 15 | Pitch | 7 diapos LaTeX (`pitch/`), vidéo de 40 s (`pitch/demo-16x9.mp4`) | répétition (C4) | équipe |
| 42 | Récompenses | boutique, échanges, bons validés par le commerçant (« Valider un bon », migration 030) | « Avant-Première » sans offre flash ; aucun tirage de tombola | Sacha |
| 50 | Anglais | parcours étudiant | restent en français : assistant de préférences (sauf la recherche de ville), espace commerçant, messages d'erreur de la base (politique de confidentialité : S6) | Sacha |

## 3. 📋 Reste à faire

### 🔴 Critique (deadline : samedi 28/11 à 13h ; gel du code à 11h)
| # | Action | Qui |
|---|---|---|
| C4 | **Répéter le pitch** avec la vidéo (`pitch/demo-16x9.mp4`, 40 s, sans son : préparer le commentaire) | équipe |
| C5 | Gel du code à 11h, dernier déploiement | Justin |
| C6 | **Déployer la mise en avant (13)** : 031 déjà lancée, donc « Mettre en avant » échoue sur le site en ligne tant qu'il n'est pas redéployé ; essayer ensuite un paiement avec un compte commerçant | Justin |

### 🟢 Bonus
| # | Tâche | Taille | Statut |
|---|---|---|---|
| 14 | Rappels de dates limites | M | TODO |
| 41 | Filtre « Ouvert maintenant » : aucune donnée d'horaires (saisie + migration, ou service externe) | M | TODO, remis à plus tard (Sacha) |
| 53 | Nouvelles icônes (« emojis » demandés aussi, mais la règle actuelle est : aucun emoji) | P | TODO (Anne-Lise) |
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
