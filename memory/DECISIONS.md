# DECISIONS — journal des décisions (ajout uniquement)

Format : `## AAAA-MM-JJ HHhMM — Titre` · Décision · Pourquoi · Alternatives écartées · Qui

## 2026-11-27 — Système de mémoire partagée
- **Décision** : `CLAUDE.md` à la racine + dossier `memory/` + hook `UserPromptSubmit` qui injecte tous les `.md` à chaque prompt.
- **Pourquoi** : 4 comptes Claude Code partagent le repo ; chacun doit connaître tout le contexte et le mettre à jour à chaque requête.
- **Qui** : setup initial

## 2026-11-27 — Git : tout sur main, géré par Claude
- **Décision** : une seule branche `main` ; chaque Claude fait pull --rebase / add / commit / push lui-même à la fin de chaque requête.
- **Pourquoi** : hackathon de 25h, 4 personnes : la vitesse compte plus que la revue de code ; moins de friction qu'avec des branches.
- **Alternatives écartées** : une branche par fonctionnalité + merge (plus lent).
- **Qui** : Justin

## 2026-11-27 — Périmètre fonctionnel
- **Décision** : 7 catégories (restaurants, grandes surfaces, transports, bourses, licence de sport, Carte Sortir, activités) ; préférences par catégorie et par zone ; zone de démo Bruz + Ker Lann ; récompense = accès complet si actif dans les 7 derniers jours + notif sur place ; piste d'amélioration : bons plans postés par les commerçants.
- **Pourquoi** : brief détaillé donné par l'équipe.
- **Qui** : équipe (transcrit par Justin)

## 2026-11-27 — Stack, nom et fonctionnalités validés
- **Stack** : Next.js + Tailwind + Supabase + Leaflet/OSM + Vercel.
- **Nom** : Waze-Etu.
- **Validé** : score de fiabilité (seuil adapté au nombre d'utilisateurs ; retrait immédiat si le commerçant dit que l'offre n'existe plus) · accès complet 7 jours après chaque contribution · niveaux d'activité avec messages d'encouragement par catégorie · favoris ❤️ + rappels de dates limites · espace commerçant · position simulée pour la démo.
- **Refusé** : comptes Asso / BDE.
- **Équipe** : Sacha, Anne-Lise, Matteo, Justin.
- **Qui** : équipe (transcrit par Justin)

## 2026-11-27 — Compte, inactifs, répartition
- **Compte obligatoire pour tout** (y compris consulter).
- **Inactif** (> 7 jours sans contribution) : voit les nouveaux bons plans avec 24 h de retard.
- **Répartition** validée (voir TASKS.md), ajustable entre nous.
- **Supabase** : le projet est créé par l'équipe, qui fournira les clés (à mettre dans `.env.local`, jamais sur git).
- **Qui** : équipe (transcrit par Justin)

## 2026-11-27 — Choix techniques du squelette
- **Pages = composants client + Supabase côté navigateur, sécurité par RLS** ; auth obligatoire gérée dans `src/proxy.ts`.
  - Pourquoi : Next 16 avec `cacheComponents` rend la lecture de cookies côté serveur piégeuse ; le client + RLS est plus simple pour 4 personnes en 25 h.
- **Retard de 24 h des inactifs appliqué en RLS** (policy sur `deals`), donc impossible à contourner depuis le front.
- **Un vote par utilisateur et par bon plan**, mis à jour pour re-confirmer.
- **Police système** au lieu de Google Fonts (le build échoue sans réseau).
- **Qui** : Justin

## 2026-11-27 — 7 jours offerts à l'inscription
- **Décision** : un nouvel inscrit a 7 jours d'accès complet (trigger `handle_new_user` → `last_contribution_at = now()`).
- **Pourquoi** : sinon il ne voit pas les bons plans des dernières 24 h, ce qui gâche la première impression et la démo.
- **Qui** : équipe (transcrit par Justin)

## 2026-11-27 — Projet Supabase
- URL : https://ilefezlnrqekmwiotnvi.supabase.co · clé publique (publishable) à mettre dans `.env.local` (pas dans git ; la demander à l'équipe).

## 2026-11-27 14h20 — Carte reprise par Justin
- **Décision** : tâche 5 scindée : **5a carte** (Justin), **5b fil + filtres** (Sacha). La carte reçoit la liste à afficher (`deals`) : les filtres n'ont qu'à la passer filtrée.
- **Pourquoi** : Justin avait fini sa partie ; l'interface de base est attendue par les autres pages.
- **Qui** : Justin (à confirmer avec Sacha)

## 2026-11-27 14h27 — Carte centrée sur l'utilisateur
- **Décision** : à l'ouverture, la carte demande la localisation et se centre sur l'utilisateur (sauf s'il a déjà déplacé la carte ou choisi une zone) ; si refus, vue Bruz + Ker Lann. La position reste dans le navigateur.
- **Pourquoi** : voir directement les bons plans autour de soi.
- **Qui** : Justin

## 2026-11-27 — Renommage Waze-Etu → ShareWood
- **Décision** : le nom du projet devient **ShareWood** (remplace Waze-Etu partout : `package.json`, titre de la page, `APP_NAME`, README, mémoire).
- **Pourquoi** : demande d'Anne-Lise.
- **Qui** : Anne-Lise

## 2026-11-27 14h34 — Habillage de la carte façon Apple Plans / Waze
- **Décision** : fond vectoriel OpenFreeMap recoloré, repères en goutte, point bleu pulsant, commandes flottantes translucides. La mise en page de l'accueil (Sacha) est conservée ; une carte plein écran a été essayée puis écartée à la fusion.
- **Pourquoi** : rendu plus joli pour la démo, gratuit et sans clé.
- **Alternatives écartées** : tuiles CARTO (clé désormais obligatoire) ; Apple / Google Maps (compte et clé) ; `maplibre-gl` 5 (faille XSS critique, d'où la version 6).
- **Qui** : Justin

## 2026-11-27 14h57 — Espace commerçant
- **Décision** : choix « Étudiant / Commerçant » à l'inscription, activation immédiate ; offres officielles (créer, modifier, retirer, remettre), statistiques, mise en avant 7 jours (paiement simulé), retrait des bons plans d'étudiants voisins ; formulaire d'offre séparé de `/publier`.
- **Garde-fous** (le statut n'est pas vérifié) : un commerce par compte, emplacement non modifiable depuis l'app, retrait limité à 75 m et à la même catégorie, auteur du retrait tracé et seul à pouvoir l'annuler.
- **Risque accepté** : un faux commerçant peut publier des offres « officielles ». En production : vérification (SIRET) avant activation.
- **À confirmer** : tarif de 9,90 € (proposé par Claude).
- **Qui** : Justin

## 2026-11-27 15h12 — Interface commerçant séparée
- **Décision** : un compte commerçant a sa propre interface (onglets Offres / Statistiques / Compte) et n'accède plus aux pages étudiantes ; type de compte lu dans `account_type` (inscription) ou le rôle en base. La redirection est un confort d'interface : les droits restent ceux de la RLS.
- **Statistiques** : uniquement des données réelles (favoris, confirmations, signalements) ; pas de compteur de vues.
- **Qui** : Justin

## 2026-11-27 15h37 — Questions obligatoires avant d'agir
- **Décision** : règle ajoutée dans `CLAUDE.md` : tout Claude pose des questions pour confirmer la demande avant de modifier le projet.
- **Pourquoi** : être sûr de la requête avant de coder.
- **Qui** : Justin (s'applique aux 4 comptes, le fichier étant partagé)

## 2026-11-27 15h47 — Profil, audience et votes
- **Audience** : vues (fiche ouverte sur la carte ou dans le fil, une par étudiant), « J'y suis allé » (ne compte pas comme contribution), favoris, votes. L'auteur n'est jamais compté et ne voit que des totaux.
- **Profil** : préférences modifiables rubrique par rubrique ; mes bons plans : consulter, modifier, « plus dispo » / remettre, supprimer ; niveau et accès 7 jours inclus (tâche 10).
- **Votes** : ajoutés par Justin (tâche 7) ; masqués sur ses propres bons plans.
- **Qui** : Justin (réponses aux questions de cadrage)

## 2026-11-27 16h05 — Jeu de données de démo
- **Décision** : remise à zéro des comptes sauf ceux de l'équipe ; 8 étudiants fictifs (`@example.com`) ; offres sourcées (web) complétées par des offres inventées sur des lieux réels, marquées « [Exemple] » ; aucun compte commerçant ; réactions (vues, passages, favoris, votes) inventées.
- **Écarté** : créer des comptes au nom de vrais commerces ou des offres « officielles » en leur nom.
- **Qui** : Justin (réponses aux questions de cadrage)

## 2026-11-27 16h10 — reset_demo : comptes à garder facultatifs
- **Décision** : une adresse à garder sans compte est ignorée (signalée à la fin) ; le script ne s'arrête plus. Il refuse toujours si la liste ou le mot de passe n'est pas rempli.
- **Pourquoi** : certains coéquipiers s'inscriront plus tard.
- **Écarté** : créer ces comptes avec le mot de passe de démo.
- **Qui** : Justin

## 2026-11-27 17h15 — Nouvelles modifications (tâches 18 à 27)
- **Décision** : accueil simplifié (3 offres « Pour toi » + « Réductions & aides ») et carte dans un onglet « Recherche » ; % de fiabilité à la place du % de compatibilité ; carte sans cercles de zone ni boutons de zone ; inscription avec menu pays / ville-campus (zones actuelles), fréquence de voyage + moyens, question « Boursier ? » à la place des choix Carte Sortir et Bourses ; publication : pré-remplissage IA gardé, relecture IA remplacée par une recherche de doublon sans IA où l'étudiant choisit.
- **Écarté** : tout attribuer d'office (tâches libres) ; supprimer les catégories Carte Sortir et Bourses ; ajouter des campus.
- **Qui** : Justin (réponses aux questions de cadrage)

## EN ATTENTE DE VALIDATION
- (rien pour l'instant)

## 2026-11-27 — Préférences et personnalisation
- **Décision** : parcours en 6 étapes (zone + GPS facultatif, transports, budget en 3 profils, pôles de dépenses ordonnés, activités, récapitulatif) ; données personnelles dans une table `preferences` privée ; fil « Pour toi » avec score et raisons ; zone Rennes ajoutée.
- **Pourquoi** : l'étudiant doit sentir une offre personnalisée avec une saisie rapide ; `profiles` est lisible par tous, donc budget et position n'y vont pas.
- **Position** : contrairement au GPS de la carte (jamais enregistré), le bouton « Me localiser » du parcours enregistre une position arrondie (~100 m), seulement à la demande.
- **Écartés** : adresse précise, budget par pôle.
- **Qui** : Sacha

## 2026-11-27 15h12 — Turbopack : racine explicite
- **Décision** : `next.config.ts` fixe `turbopack.root` sur le dossier du projet.
- **Pourquoi** : un `package-lock.json` (vide) dans un dossier parent, hors du repo, faisait choisir à Turbopack la mauvaise racine et cassait la résolution de `maplibre-gl` au build. Fixer la racine évite ce problème quel que soit l'environnement de chacun.
- **Qui** : Anne-Lise

## 2026-11-27 — Publication : lieu trouvé via Photon, saisie manuelle
- **Décision** : `/publier` = formulaire manuel (pas d'extraction par IA). Lieu précis : nom du magasin + ville → recherche **Photon** (géocodeur OpenStreetMap, gratuit, sans clé, appelé depuis le navigateur) → l'étudiant choisit le lieu exact ; repli « utiliser ma position ». La catégorie (et une activité) est proposée d'après le type de lieu OSM, modifiable. Zone rattachée = zone la plus proche si le lieu est à moins de rayon + 5 km.
- **Pourquoi** : simple et fiable pour la démo ; Photon accepte les appels navigateur (CORS) et la recherche par nom de commerce, contrairement à l'API Adresse (adresses seulement).
- **Écartés** : extraction depuis une photo par IA (clé API, temps) ; Nominatim (pas fait pour la recherche répétée côté client) ; Google Places (clé payante).
- **Qui** : Matteo

## 2026-11-27 — Voyages et budget
- **Décision** : étape « longs trajets » (retours chez les parents : souvent / parfois / rarement ; envie de voyager ; train, avion, bus, covoiturage). L'avion quitte les transports du quotidien. Le budget ne retire plus d'offre de « Pour toi » : il la fait seulement descendre.
- **Pourquoi** : les étudiants rentrent souvent en train ou en avion ; demande de moins recommander plutôt que masquer.
- **Écartés** : ville des parents (les bons plans n'ont pas de destination).
- **Qui** : Sacha

## 2026-11-27 — Assistant IA de publication (Claude)
- **Décision** : route serveur `/api/assist` (clé `ANTHROPIC_API_KEY` jamais envoyée au navigateur, connexion Supabase exigée) avec deux actions : **extract** (photo d'affiche et/ou texte libre → champs du formulaire, l'étudiant relit) et **review** au moment de publier (titre à améliorer, contenu refusé si spam / injurieux, doublon parmi les bons plans de même catégorie à moins de 300 m ou de même zone, 60 derniers jours). Doublon → bouton « C'est le même : je le confirme » (vote 👍) au lieu d'un second bon plan.
- **Modèle** : `claude-opus-5-5`, effort `low` (rapidité), sorties JSON structurées (schéma imposé), repli serveur `fallbacks: "default"` si le modèle décline. Photo envoyée directement (pas d'OCR), redimensionnée à 1568 px côté navigateur.
- **Repli** : sans clé ou si l'IA est en panne, le formulaire fonctionne comme avant (pré-remplissage indisponible, publication sans relecture).
- **Pourquoi** : contrôle qualité et anti-doublons demandés ; publier depuis une photo est plus rapide pour la démo.
- **Qui** : Matteo

## 2026-11-27 16h40 — Favoris par catégorie + en-tête de marque
- **Décision** : la page `/favoris` regroupe les bons plans par catégorie (plutôt qu'une seule liste triée par échéance) ; `/` et `/favoris` ont une barre de marque fixe en haut (nom du site en grand, icône) pendant que le contenu défile dessous.
- **Pourquoi** : retrouver facilement un favori quand on en a beaucoup ; rendre l'app plus « sérieuse », moins brouillon, à la demande d'Anne-Lise.
- **Qui** : Anne-Lise

## 2026-11-27 — Gemini pour l'assistant de publication
- **Décision** : l'assistant `/api/assist` utilise **Gemini** quand `GEMINI_API_KEY` est définie (prioritaire), sinon Claude. Même prompt et même schéma JSON pour les deux ; les valeurs renvoyées sont revérifiées (listes de catégories, dates…) avant d'arriver dans le formulaire.
- **Pourquoi** : l'API Claude est payante et un abonnement Claude Pro ne donne pas de clé API ; Google propose une clé API Gemini avec une offre gratuite (Google AI Studio). L'abonnement Gemini Pro grand public ne donne pas non plus de clé API.
- **Qui** : Matteo

## 2026-11-27 17h15 — Relookage « plus professionnel »
- **Décision** : nouveau jeu d'icônes sobres en SVG (`src/components/icons.tsx`), utilisé dans `NavBar.tsx` et pour le cœur favori (`DealCard.tsx`) à la place des emoji. En-tête de marque (`/`, `/favoris`) simplifié : petit carré bleu + nom en noir, sans emoji. `/favoris` : chaque catégorie est repliable (état mémorisé sur l'appareil, `localStorage`).
- **Pourquoi** : demande d'Anne-Lise (« ça fait un peu bébé ») — trop d'emoji et de couleurs/arrondis ludiques.
- **Périmètre** : volontairement limité aux pages d'Anne-Lise + aux deux fichiers partagés `NavBar`/`DealCard` (changement visuel seul, aucune route ni comportement modifié). La carte, `/commercant`, `/profil`, `/publier`, `/onboarding` et les emoji de `TRANSPORT_MODES`/`BUDGET_PROFILES` n'ont pas été touchés pour ne pas interférer avec le travail en cours de Justin, Matteo et Sacha (voir `TASKS.md`).
- **Qui** : Anne-Lise

## 2026-11-27 — Modèle Gemini par défaut : gemini-3.5-flash
- **Décision** : modèle par défaut `gemini-3.5-flash`, avec repli automatique sur `gemini-3.5-flash-lite` puis `gemini-3.8-flash`.
- **Pourquoi** : au test réel, `gemini-3.8-flash` et `3.7-flash` renvoyaient « high demand » (503) à chaque appel, parfois après 25 s d'attente ; `gemini-2.5-flash` n'est plus ouvert aux nouveaux comptes (404). `gemini-3.5-flash` répond en 4 à 8 s.
- **Qui** : Matteo

## 2026-11-27 — Photo de preuve d'un bon plan
- **Décision** : la photo analysée par l'assistant IA est gardée comme preuve (l'étudiant peut la retirer avant de publier) ; pas de photo sans passer par l'IA. Affichée **dans le fil seulement** (miniature dans `DealCard`, donc aussi dans les favoris ; en grand au toucher), pas sur la carte. Stockage Supabase **public** `deal-photos`.
- **Pourquoi** : choix de Matteo (questions posées avant de coder). Lien public : simple et rapide, ce sont des photos d'affiches de magasin.
- **Avertissement Next « Instant navigation »** sur `/` : ignoré (contrôle affiché seulement en développement, sans effet sur le site), choix de Matteo.
- **Qui** : Matteo

## 2026-11-27 — « Signaler » devient « Partager »
- **Décision** : publier un bon plan se dit désormais **« Partager »** (onglet de la barre du bas, titre de /publier, bouton « Partager un autre bon plan », lien du profil, textes d'ActivityCard, description du site). « Signaler 👎 » garde son sens : dire qu'une offre n'existe plus.
- **Qui** : Matteo

## 2026-11-27 — Compte et confidentialité
- **Décision** : publications anonymes (profils lisibles par leur seul propriétaire) ; photo publiée seulement sur accord (case décochée) ; case « 15 ans + politique de confidentialité » à l'inscription ; mot de passe (actuel exigé) et déconnexion de tous les appareils, nouveau mot de passe ≥ 8 ; à la suppression du compte, seuls les bons plans actifs et confirmés par d'autres restent, sans auteur.
- **Écartés** : changement d'email et mot de passe oublié (envois d'emails à configurer).
- **Limite** : la confirmation par mot de passe est faite par l'app, la base ne l'impose pas.
- **Qui** : Sacha

## 2026-11-27 18h30 — Refonte visuelle complète + interdiction des emoji
- **Décision** : nouveau système de design appliqué à toute l'app (pas seulement les pages d'Anne-Lise), à partir de `DESIGN_SHAREWOOD.md` : polices Newsreader + Inter auto-hébergées (`public/fonts/`), palette forêt/aubergine/sauge/lilas/crème en jetons CSS (`globals.css`), logo SVG, `CategoryIcon` (rond coloré par catégorie), extension d'`icons.tsx`. **Aucun emoji nulle part dans l'app** : remplacé par une icône SVG dédiée, ou simplement retiré du texte quand c'est une chaîne brute (`<option>`, libellés joints, raisons de matching) qui ne peut pas contenir de JSX.
- **Pourquoi** : demande explicite d'Anne-Lise, plus stricte que le document de design (« je ne veux pas d'émojis apple ou autre, je veux de vrais designs »).
- **Portée** : changement **uniquement visuel** — aucune logique, donnée, route ni appel Supabase modifié. `next/font/google` écarté pour la même raison que la police système avant elle (build qui échoue sans réseau sur certains postes) : auto-hébergement des `.woff2` à la place.
- **Qui** : Anne-Lise

## 2026-11-27 — Crédits et badges (à implémenter)
- **Décision** : des crédits s'obtiennent en interagissant avec les offres, publier rapportant plus que confirmer qu'une offre existe ; ils débloquent des badges et une progression, puis éventuellement des avantages d'entreprises qui alimentent les offres.
- **Préalable** : crédits calculés par la base, avec règles anti-triche (vote sur son propre bon plan, publication puis suppression).
- **Qui** : Sacha

## 2026-11-27 — Tâche 27 : doublons sans IA à la publication
- **Décision** : plus aucune relecture IA à la publication (titre, modération, doublon) ; l'IA ne sert plus qu'au pré-remplissage par photo / texte. **Lieu précis** : dès le choix du lieu, liste « Déjà partagé ici (N) » des offres encore valables au **même établissement = même nom de lieu** (`place_name` identique ; rien pour « Ma position actuelle »). **Zone / partout** : au clic sur Publier, offres de **même catégorie, même portée et même zone** ; « Non, publier la mienne » publie. « C'est la même offre » → vote 👍 sur l'existante + écran **« Bon plan validé »** ; sur son propre bon plan, pas de bouton (« C'est ton bon plan »).
- **Pourquoi** : choix de Matteo (questions posées avant de coder), cadrage de Justin (tâche 27). Plus simple, gratuit et instantané.
- **Conséquence** : plus de modération automatique (titres injurieux, spam) ; reste le signalement 👎 par les étudiants.
- **Qui** : Matteo

## 2026-11-27 17h38 — Accueil, recherche, carte et inscription (tâches 18 à 26)
- **Accueil** : 3 offres « Pour toi » (sinon les plus récentes) + rubriques dépliables « Réductions & aides » ; **Recherche** : carte + fil complet, sans le résumé des préférences.
- **Bascule** : une catégorie sans aucune offre « Pour toi » fait passer sur « Tout » (couvre « absente du profil » sans basculer quand il y a des trajets ou aides à montrer).
- **Inscription** : voyage = une fréquence + moyens, même pour « Rarement » (priorité faible) ; « Boursier ? » et « Carte Sortir (ou droit) ? » déclarés par l'étudiant, qui décident de « Pour toi ».
- **Écarté** : déduire l'éligibilité à la Carte Sortir de la bourse (conditions de ressources).
- **Qui** : Justin (réponses aux questions de cadrage)

## 2026-11-27 17h51 — Pas de vote sur son propre bon plan
- **Décision** : règle en base (`011`) ; les votes d'auteurs déjà enregistrés sont effacés. Les bons plans sans auteur restent votables.
- **Qui** : Justin (réponses aux questions de cadrage)

## 2026-11-27 17h57 — Badge « Grande enseigne »
- **Décision** : badge aubergine d'après le nom du lieu (liste dans le code), sans migration ni effet sur le tri.
- **Limite** : liste à tenir à jour ; un lieu dont le nom commence comme une enseigne (« Action… », « Paul… ») serait badgé à tort.
- **Qui** : Justin

## 2026-11-27 18h00 — Bouton « Y aller »
- **Décision** : dans la fiche seulement, un bouton ouvre l'itinéraire : Apple Plans sur iPhone / iPad / Mac, Google Maps ailleurs ; affiché pour les offres qui ont des coordonnées (y compris les siennes).
- **Qui** : Justin (réponses aux questions de cadrage)

## 2026-11-27 18h00 — Carte Sortir devient une condition, liens d'offre (tâche 28)
- **Décision** : « Carte Sortir » n'est plus une catégorie mais une **condition** d'accès, comme la carte étudiante. Nouvelle colonne `deals.requirements` (carte étudiante, Carte Sortir, boursiers, moins de 26 ans), choisie à la publication et affichée en badges ; les offres Carte Sortir passent en **Activités**. La question « Carte Sortir ? » de l'inscription est gardée : répondu non → ces offres sortent de « Pour toi ».
- **Liens** : champ facultatif « Lien vers l'offre » (`deals.link_url`, http(s) seulement, contrôlé en base) → bouton « Voir l'offre · site » sur la carte du fil et la fiche ; les URL écrites dans la description deviennent cliquables (nom du site affiché). Les « Source : https://… » des données de démo deviennent ce lien. L'assistant IA remplit aussi conditions et lien s'ils sont écrits.
- **Pourquoi** : demande de Matteo (questions posées avant de coder) ; les liens partagés n'étaient que du texte.
- **Écarté** : retirer la valeur `carte_sortir` du type Postgres sur la vraie base (il faudrait recréer le type et ses dépendances) → interdite par une contrainte ; espace commerçant non modifié (ses offres passent par une fonction SQL).
- **Qui** : Matteo

## 2026-11-27 18h14 — Commerçant / Étudiant, et données de démo élargies
- **Décision** : le badge « Grande enseigne » (demande mal formulée) est supprimé ; chaque offre porte « Commerçant » ou « Étudiant », avec un filtre dans la recherche.
- **Démo** : ~150 bons plans à 15 km de Bruz ; commerces **fictifs** « (démo) » pour les offres officielles ; offres d'étudiants inventées sur des lieux réels, marquées « [Exemple] ».
- **Écarté** : des comptes ou offres officielles au nom de vrais commerces.
- **Qui** : Justin (réponses aux questions de cadrage)

## 2026-11-27 18h25 — « Toujours dispo » fusionné dans « J'y suis allé » (tâche 29)
- **Décision** : le bouton « Toujours dispo » disparaît. « J'y suis allé » enregistre le passage **et** une confirmation (vote +1) : il fait monter la fiabilité et compte comme contribution. « J'y suis allé » et « Plus dispo » s'excluent (l'un remplace l'autre) et se **décochent** en touchant à nouveau (migration 013 : un étudiant peut supprimer son vote).
- **Pourquoi** : demande de Matteo (questions posées avant de coder) : les deux boutons disaient la même chose, et un clic par erreur ne pouvait pas être annulé.
- **Limite** : décocher ne retire pas les 7 jours d'accès déjà gagnés (la date de contribution n'est pas recalculée).
- **Qui** : Matteo

## 2026-11-27 18h40 — Fiabilité en code couleur (tâche 30)
- **Décision** : plus de pourcentage de fiabilité ; un badge pastille + mot court : rouge « Douteux » (< 40 %), jaune « À vérifier » (< 65 %), vert clair « Fiable » (< 85 %), vert foncé « Très fiable » ; « Nouveau » (lilas) sans réaction. Sur les cartes du fil et dans la fiche (qui garde « Confirmé il y a … par N étudiants »).
- **Pourquoi** : demande de Matteo (questions posées avant de coder) ; un mot + une couleur se lit plus vite qu'un % et reste lisible pour les daltoniens et les lecteurs d'écran.
- **Inchangé** : calcul du score et masquage sous 30 % ; fenêtre de la carte ; % de confirmations des statistiques commerçant.
- **Qui** : Matteo

## 2026-11-27 19h00 — Tri « Hot » et badge « Tendance » (tâche 32)
- **Décision** : l'onglet « Tout » de Recherche n'est plus chronologique mais trié « Hot » (façon Reddit / Hacker News) : nombre de « J'y suis allé » (log), vitesse des réactions récentes (demi-vie 24 h, « Plus dispo » pénalise ×1,5) et fraîcheur de l'offre (exposant 1,2). Seules les offres sponsorisées restent au-dessus. Badge « Tendance » (flamme) dès 3 « J'y suis allé » en 24 h.
- **Pourquoi** : demande de Matteo (questions posées avant de coder) ; mettre en avant ce qui marche en ce moment.
- **Écarté** : bonus date limite proche ou offre officielle (choix de Matteo : seul le sponsoring passe devant) ; Hot sur l'accueil et sur « Pour toi ».
- **Effet connu** : une offre toute neuve sans réaction passe devant une offre de 2 jours très confirmée (réglable : `HOT.gravity`).
- **Qui** : Matteo

## 2026-11-27 19h15 — Accueil en onglets (tâche 31)
- **Décision** : sur l'accueil, sous la barre de recherche (vraie saisie), des onglets « Pour toi » puis les 4 rubriques (Voyager, Aides & bourses, Culture & sport, Quotidien) ; les rubriques rassemblent **toutes** les offres, sur la carte ou non. La page carte perd « Pour toi / Tout » et « Tous / Commerçants / Étudiants » et garde les catégories ; sa liste montre tout, triée « Hot ».
- **Écartés** : onglets « Offres dématérialisées » et « Commerçants ».
- **Remplace** : la section « Réductions & aides » (offres sans lieu seulement) et la bascule automatique de la tâche 25. Le badge « Commerçant / Étudiant » reste sur les cartes.
- **Qui** : Sacha

## 2026-11-27 19h01 — Forme des onglets de l'accueil
- **Décision** : de vrais onglets rectangulaires, les 5 visibles sur une ligne (libellés sur deux lignes si besoin), l'onglet choisi rempli en vert et relié à la liste.
- **Écartés** : pastilles rondes, icônes au-dessus des noms, barre qui défile.
- **Qui** : Sacha

## 2026-11-27 19h45 — Fiabilité façon Waze, poids par étudiant (tâche 33)
- **Décision** : chaque réaction pèse selon son auteur (comme les rangs Waze), de 0,5 à 2 : **justesse passée** (ses réactions vont-elles dans le sens des autres sur les mêmes offres ? lissée pour les nouveaux) × **activité** sur 30 jours × **ancienneté** (compte de moins de 3 jours × 0,6, anti faux comptes). Calcul **dans la base** (`voter_stats`, `deal_trust`), jamais exposé utilisateur par utilisateur ; chacun voit seulement son rang (Débutant / Confirmé / Expert) dans son profil.
- **Temps et « Plus dispo »** : demi-vie 48 h ; **confiance qui s'érode** (a priori 0,5 : sans confirmation récente, une offre redescend vers « À vérifier ») ; **le dernier mot compte** (« Plus dispo » plus récent que la dernière confirmation × 1,5) ; **masquage selon le poids** (somme pondérée des « Plus dispo » ≥ seuil de la zone).
- **Pourquoi** : demande de Matteo (questions posées avant de coder) : un vieux vote ou un compte jetable ne doit pas peser autant qu'un étudiant fiable et récent.
- **Écartés** : bonus selon la fiabilité de ses publications ; vote « sur place » (GPS) ; bandeau « Toujours là ? ».
- **Repli** : sans la migration 014, même formule avec un poids de 1 pour tous.
- **Qui** : Matteo

## 2026-11-27 19h12 — Recherche de l'accueil (tâche 34)
- **Décision** : la recherche porte sur toutes les offres (liste unique à la place des onglets), classées par pertinence ; elle tolère les fautes et les pluriels et propose des mots proches, d'après une liste écrite dans le code.
- **Écartés** : filtrer onglet par onglet ; recherche par IA (saisie envoyée à l'extérieur, quota) ; ajouter des offres « kebab » aux données de démo.
- **Qui** : Sacha

## 2026-11-27 20h05 — Carte de bon plan réduite à l'essentiel (tâche 35)
- **Décision** : la carte montre seulement : icône, titre (+ flamme si Tendance), prix · lieu · distance, pastille de fiabilité, cœur, badge Commerçant / Étudiant, conditions, échéance, et **les deux réactions avec leurs compteurs** (« J'y suis allé (12) », « Plus dispo (2) », 30 derniers jours) cliquables directement (cocher / décocher). Toucher la carte ouvre la fiche (description, photo, lien, itinéraire). Plus de « Voir et réagir », plus d'étiquette « Sponsorisé » (le cadre doré suffit), plus de raisons « Ta priorité n°2 », « Dans ton budget »… (seule la distance reste). Même chose dans la fenêtre d'un repère sur la carte.
- **Pourquoi** : demande de Matteo (questions posées avant de coder) : trop d'informations par bon plan, et réagir doit être immédiat.
- **Inchangé** : le calcul de la compatibilité (tri « Pour toi ») et de la fiabilité.
- **Qui** : Matteo

## 2026-11-27 19h34 — Filtres de la recherche (tâche 36)
- **Décision** : sous la recherche, filtres prix, temps de trajet (moyen + durée), conditions et tri ; « gratuit », « pas cher » et « près de moi » activent les filtres. Durées estimées à vol d'oiseau (comme « Pour toi »), sans service d'itinéraire.
- **Écartés pour l'instant** : « Ouvert maintenant » (aucune donnée d'horaires), filtres fiabilité et catégorie.
- **Qui** : Sacha

## 2026-11-27 20h25 — Démo sans « [Exemple] », plus de montant ni de flamme (tâche 37)
- **Décision** : « [Exemple] » quitte les titres des offres inventées (il prenait de la place et cassait la démo) ; elles restent signalées « Exemple fictif (démo) : offre inventée. » dans leur description, visible seulement dans la fiche. Le champ montant (`price_info`) n'est plus saisi ni affiché nulle part : le titre dit l'avantage (« Menu étudiant à 6,50 € »), l'IA l'y met. Le niveau de prix reste (filtres). Flamme « Tendance » retirée.
- **Pourquoi** : demande de Matteo (questions posées avant de coder) : redondance titre / montant, carte encore trop chargée.
- **Écarté** : supprimer toute mention de fiction (fausses promos de vrais commerces présentées comme vraies sur un site en ligne).
- **Qui** : Matteo

## 2026-11-27 20h45 — Pas de formule d'accueil (tâche 39)
- **Décision** : plus de « Bonjour <pseudo> » (ni « Les bons plans étudiants ») en haut de l'Accueil et de Recherche : la page commence par la recherche ou la carte ; un titre `sr-only` reste pour les lecteurs d'écran. Règle pour la suite : pas de mots de politesse ou de remplissage dans l'interface.
- **Pourquoi** : demande de Matteo (« mots superflus »), portée confirmée avant de coder ; « Fil des bons plans », le compteur de Recherche et « Mes favoris » sont gardés.
- **Qui** : Matteo

## 2026-11-27 20h18 — Les Flèches (tâche 17b)
- **Décision** : points « Flèches » calculés par la base (+50 publication, +30 à 3 confirmations, +10 confirmation, +15 signalement corroboré, × 1,5 en série de 3 jours, 5 votes payés par jour) ; rangs à 150 et 500. Boutons « J'y suis allé » / « Plus dispo » conservés, avec le gain affiché. **3 signalements archivent l'offre** et remplacent le masquage pondéré. Distance connue : moitié au-delà de 500 m, rien au-delà de 2 km ; **sans position, pas de pénalité pour l'instant (à revoir)**. Les autres niveaux du profil sont gardés.
- **Écartés** : renommer les boutons « Toujours dispo » / « Offre expirée » ; refuser le vote à distance ; emojis (règle de l'équipe : icônes dessinées).
- **Choix par défaut** : vote retiré ou offre supprimée → gains retirés ; pas de points rétroactifs ; solde privé ; commerçants sans Flèches.
- **Qui** : Sacha

## 2026-11-27 soir — Recherche déplacée sur Recherche, surlignage sur la carte
- **Décision** : la barre de recherche et ses filtres quittent l'Accueil (qui ne garde que ses onglets) pour la page Recherche, à la place des puces de catégorie (retirées, gain de place). Toucher une offre **localisée** dans une liste de Recherche (recherche ou fil « Hot ») centre la carte sur elle et la met en avant (contour aubergine, rebond), sans ouvrir sa fiche, pour comparer vite plusieurs offres par leur distance. Une offre **sans lieu** (zone / nationale) garde l'ouverture de sa fiche au toucher, faute de repère à montrer.
- **Pourquoi** : demande d'Anne-Lise (questions posées avant de coder, toutes les options recommandées retenues) ; touche des fichiers actifs de Sacha (recherche, onglets, filtres) et Justin (carte), signalé dans `TASKS.md`.
- **Écarté** : perdre l'accès à la fiche pour les offres sans lieu (corrigé par le repli automatique sur `DealCard`) ; filtrer aussi la carte par la recherche (elle montre toujours toutes les offres localisées, pour voir le contexte complet en comparant).
- **Qui** : Anne-Lise

## 2026-11-27 soir — Surlignage aussi sur la carte dans la liste, étiquette « Sponsorisé » revenue
- **Décision** : sur Recherche, l'offre choisie sur la carte (`selectedId`) est maintenant aussi surlignée dans la liste (contour aubergine sur `DealCard`, même couleur que son repère), pour relier visuellement carte et liste. Étiquette **« Sponsorisé »** réintroduite (icône + texte) sur `DealCard` et dans la fenêtre de `DealsMap`, en plus du cadre/contour doré, indépendamment du surlignage de sélection (priorité visuelle à l'aubergine si l'offre est à la fois sponsorisée et choisie).
- **Pourquoi** : demande d'Anne-Lise — sans surlignage dans la liste, le lien avec le repère choisi sur la carte n'était pas visible ; sans texte, le cadre doré ne disait pas ce qu'il signifiait (« mises en avant sans savoir pourquoi »). **Revient en partie sur la tâche 35** (Matteo : « le cadre doré suffit, plus d'étiquette Sponsorisé ») : la pratique a montré que ça ne suffisait pas.
- **Qui** : Anne-Lise

## 2026-11-27 20h47 — Page « Ciblés » et boutique de récompenses (tâche 42)
- **Décision** : l'onglet Favoris devient « Ciblés » : Flèches et influence fusionnées en haut, puis Favoris / Activité (historique, accès 7 jours, niveau) / Récompenses (solde, mes bons, boutique). Le profil les perd et renvoie vers la boutique. Solde = gains − dépenses, rang d'après les gains. 3e rang : « Robin des Étudiants ». Compte de démo : `demo.sarah` (485).
- **Écartés** : « Mes récompenses » dans le profil ; renommer « Robin des Campus ».
- **Choix par défaut** : partenaires fictifs ; Avant-Première sans effet sur les offres pour l'instant ; pas de tirage codé ; QR code dessiné dans le navigateur (bibliothèque `qrcode`).
- **Qui** : Sacha

## 2026-11-27 soir — README tenu à jour
- **Décision** : le README présente l'appli (jury d'abord, puis installation), avec une courte section de limites ; tout changement visible le met à jour dans le même commit (règle dans `CLAUDE.md`).
- **Écartés** : mise à jour à chaque commit de code (conflits à 4) ; taire les limites.
- **Qui** : Justin

## 2026-11-27 21h20 — Fin de l'accès limité, publications plafonnées (tâche 43)
- **Décision** : plus d'accès complet 7 jours ni de retard de 24 h : tout le monde voit tout ; l'inactif ne gagne simplement pas de Flèches. La date de dernière contribution n'est plus relevée et est effacée. 3 publications récompensées par jour (au-delà : publiées, sans création ni bonus). Niveaux d'activité conservés.
- **Remplace** : les décisions « Compte, inactifs » et « 7 jours offerts à l'inscription ».
- **Qui** : Sacha

## 2026-11-27 21h32 — Un seul « Grade » sur la page Ciblés (tâche 44)
- **Décision** : la carte montre un bloc « Grade » (Éclaireur, Chasseur de bons plans, Robin des Étudiants, seul le sien éclairé, seuils expliqués) ; la pastille de rang en haut et « Ton influence » disparaissent (pas d'information en double).
- **Remplace** : l'affichage Débutant / Confirmé / Expert (tâche 33) ; le poids reste calculé pour la fiabilité.
- **Qui** : Sacha

## 2026-11-27 21h46 — Profil sans Flèches (tâche 46)
- **Décision** : le bouton « Utiliser mes Flèches » et le Badge Doré quittent le profil ; Flèches, badge et boutique sont réunis dans « Ciblés ».
- **Qui** : Sacha

## 2026-11-27 soir — « Partager » plus rapide (tâche 45)
- **Décision** : même formulaire, allégé : lieu, titre, catégorie visibles ; prix, détails, conditions, lien, activités et dates sous « Plus de détails » (replié, nombre de champs remplis affiché) ; photo analysée dès qu'elle est prise ; accord pour publier la photo inchangé (case à cocher).
- **Écartés** : liste des commerces autour de soi ; parcours « photo d'abord » ; champs en 2e étape ou supprimés.
- **Qui** : Justin (réponses aux questions de cadrage ; accord de Matteo indiqué par Justin)

## 2026-11-27 soir — Contrôle « instant navigation » limité
- **Décision** : il ne s'applique plus qu'aux pages qui exportent `instant` (`next.config.ts`). Remplace le choix d'ignorer le message (Matteo, photo de preuve).
- **Écarté** : rendre la page avant de connaître le type de compte (un commerçant verrait l'interface étudiante).
- **Qui** : Justin

## 2026-11-27 21h58 — Activité allégée (tâche 47)
- **Décision** : « Ciblés > Activité » = niveau sur une ligne, puis mes bons plans (déplacés du profil, lignes dépliables), puis l'historique. Chaque information à un seul endroit : les Flèches de publication et de bonus sur le bon plan, les votes et échanges dans l'historique (5 lignes, « Voir tout »).
- **Retirés** : « Ta spécialité », compteur sur 7 jours, totaux de vues et passages, les « passages » (même geste que « J'y suis allé »).
- **Qui** : Sacha

## 🚨 2026-11-27 soir — Déploiement Vercel cassé (build-rate-limit) — à régler avant la deadline
- **Constat** : les 3 derniers commits poussés (`9a3f9d3`, `adf2eb6`, `17087b2`) ont un déploiement Vercel en `failure`, raison `upgradeToPro=build-rate-limit` (vérifié via l'API GitHub, statuts de commit ; confirme le diagnostic de Justin dans `JOURNAL.md`). Le site en ligne tourne donc sur un ancien build et **n'a pas les derniers correctifs**, même si le code sur `main` est à jour.
- **Pourquoi ça compte** : la deadline est demain 28/11 à 13h ; si le jury regarde le site déployé, il verra une version en retard. Tester sur le site en ligne en ce moment peut faire croire à un bug qui n'existe pas dans le code (déjà arrivé : retour utilisateur sur un correctif pourtant fonctionnel en local).
- **À faire (décision de l'équipe, pas prise ici)** : soit attendre que la limite de builds Vercel se réinitialise, soit passer le projet Vercel en Pro (payant), soit limiter la fréquence des push le temps que ça se résorbe. Vérifier aussi le lien du projet (`https://vercel.com/hackathon29`).
- **En attendant** : tester en local (`npm run dev`) plutôt que sur le site déployé pour juger si un correctif marche.
- **Qui** : Anne-Lise (constat ; décision de résolution à prendre par l'équipe)

## 2026-11-27 soir — Second déploiement Vercel
- **Décision** : nouveau projet `sharewood-ensai` sur le compte Vercel de Justin, déployé à la demande, car l'ancien projet refuse les déploiements (limite atteinte).
- **Écarté pour l'instant** : attendre 24 h (après la deadline) ; passer en Pro (payant).
- **Qui** : Justin

## 2026-11-27 22h20 — Déploiement à la demande
- **Décision** : déploiement au push coupé (`vercel.json`) ; tests en local ; Claude propose un déploiement si le dernier date de plus de 30 min et que du code a changé, et ne déploie que sur accord.
- **Écartés** : garder l'automatique en regroupant les push ; réduire aussi les essais automatisés ; rappel toutes les heures.
- **Qui** : Justin

## 2026-11-27 soir — Affichage sur ordinateur (tâche 48)
- **Décision** : à partir de 1024 px, barre de navigation en haut ; Recherche en liste + carte ; offres en 2 ou 3 colonnes ; autres pages en colonne centrée plus large ; espace commerçant compris. Téléphone inchangé.
- **Écartés** : menu vertical à gauche ; barre en bas conservée ; carte au-dessus d'une grille ; Partager et Profil en deux colonnes.
- **Qui** : Justin (réponses aux questions de cadrage)

## 2026-11-27 soir — Cadrage des améliorations (tâches 49 à 64)
- **Décisions** : deux réglages au profil (désactiver la localisation ; anglais) ; réactions limitées à 500 m ; onglet « Restauration », « Quotidien » = grandes surfaces ; +10 pour « Plus dispo » comme pour « J'y suis allé ». Rien n'est encore codé.
- **Qui** : équipe (transcrit par Justin)

## 2026-11-27 23h25 — Deux grosses tâches
- **Décision** : les diapos du pitch (tâche 15) sont prioritaires samedi matin ; les vraies offres (tâche 65) se font si le temps le permet, recherche web ou API à trancher alors.
- **Qui** : Justin
