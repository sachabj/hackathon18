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
