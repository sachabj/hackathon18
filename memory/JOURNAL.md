# JOURNAL — historique des requêtes (ajout uniquement, plus récent en bas)

Format : `### AAAA-MM-JJ HHhMM — Prénom` puis puces : ce qui a été fait, fichiers touchés.

### 2026-11-27 ~11h00 — setup initial
- Création du système de mémoire : `CLAUDE.md`, `memory/*.md`, hook `.claude/settings.json`.
- Idée consignée dans `PROJECT.md` (Waze des bons plans étudiants : restaurants, magasins, transport).
- Stack proposée (non validée) dans `ARCHITECTURE.md`.

### 2026-11-27 ~11h30 — Justin
- Dossier lié au repo GitHub `sachabj/hackathon18` (branche `main`, historique distant conservé).
- `.gitignore` complété (Node/Next/.env), `README.md` réécrit.
- `CLAUDE.md` : nouvelle section Git → Claude commit + push automatiquement après chaque requête.
- Mémoire mise à jour : `DECISIONS.md`, `ARCHITECTURE.md`.

### 2026-11-27 ~12h00 — Justin
- Brief détaillé du projet intégré dans `PROJECT.md` : 7 catégories, préférences (catégories + zones Bruz / Ker Lann), système de récompenses, piste commerçants.
- 8 propositions de Claude ajoutées dans `PROJECT.md` (à valider).
- `ARCHITECTURE.md` : modèle de données révisé (zones, scope local/zone/national, profiles.last_active_at) + contrainte sur la géolocalisation web.
- `TASKS.md` : liste des tâches refaite (14 tâches).

### 2026-11-27 ~12h30 — Justin
- Propositions tranchées par l'équipe → `PROJECT.md` réécrit (nom **Waze-Etu**, 8 fonctionnalités validées, Asso refusé).
- Stack validée ; modèle de données complété (favorites, role merchant, last_contribution_at) + règles métier dans `ARCHITECTURE.md`.
- Équipe renseignée + répartition proposée dans `TASKS.md`.
- Hook mémoire modifié : il affiche la liste des .md à lire au lieu de leur contenu (au-delà de ~10 Ko, la sortie d'un hook est tronquée).

### 2026-11-27 ~13h00 — Justin
- Décisions : compte obligatoire pour tout, 24 h de retard pour les inactifs, répartition validée → `PROJECT.md`, `DECISIONS.md`, `TASKS.md`.
- Démarrage du squelette Next.js (tâche 3). BDD en attente des clés Supabase.
