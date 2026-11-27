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

## EN ATTENTE DE VALIDATION
- (rien pour l'instant)

## 2026-11-27 — Préférences et personnalisation
- **Décision** : parcours en 6 étapes (zone + GPS facultatif, transports, budget en 3 profils, pôles de dépenses ordonnés, activités, récapitulatif) ; données personnelles dans une table `preferences` privée ; fil « Pour toi » avec score et raisons ; zone Rennes ajoutée.
- **Pourquoi** : l'étudiant doit sentir une offre personnalisée avec une saisie rapide ; `profiles` est lisible par tous, donc budget et position n'y vont pas.
- **Position** : contrairement au GPS de la carte (jamais enregistré), le bouton « Me localiser » du parcours enregistre une position arrondie (~100 m), seulement à la demande.
- **Écartés** : adresse précise, budget par pôle.
- **Qui** : Sacha

## 2026-11-27 — Publication : lieu trouvé via Photon, saisie manuelle
- **Décision** : `/publier` = formulaire manuel (pas d'extraction par IA). Lieu précis : nom du magasin + ville → recherche **Photon** (géocodeur OpenStreetMap, gratuit, sans clé, appelé depuis le navigateur) → l'étudiant choisit le lieu exact ; repli « utiliser ma position ». La catégorie (et une activité) est proposée d'après le type de lieu OSM, modifiable. Zone rattachée = zone la plus proche si le lieu est à moins de rayon + 5 km.
- **Pourquoi** : simple et fiable pour la démo ; Photon accepte les appels navigateur (CORS) et la recherche par nom de commerce, contrairement à l'API Adresse (adresses seulement).
- **Écartés** : extraction depuis une photo par IA (clé API, temps) ; Nominatim (pas fait pour la recherche répétée côté client) ; Google Places (clé payante).
- **Qui** : Matteo
