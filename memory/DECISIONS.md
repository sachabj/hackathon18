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

## EN ATTENTE DE VALIDATION
- Stack technique (proposition dans ARCHITECTURE.md)
- Web app vs app mobile
- Nom de l'app (propositions dans PROJECT.md)
- Les 8 propositions 💡 de Claude dans PROJECT.md
- Ce que voit un utilisateur inactif
