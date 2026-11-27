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

## EN ATTENTE DE VALIDATION
- (rien pour l'instant)
