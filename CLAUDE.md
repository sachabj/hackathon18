# CLAUDE.md — Point d'entrée obligatoire (lu automatiquement par Claude Code)

Projet de hackathon ENSAI (équipe de 4 étudiants 3A, 4 comptes Claude Code sur un même repo git).
**Deadline : samedi 28 novembre 2026 à 13h00.**

## 🔁 PROTOCOLE OBLIGATOIRE À CHAQUE REQUÊTE

### 1. AVANT de faire quoi que ce soit
1. `git pull --rebase` (si le repo a un remote) pour récupérer le travail des autres.
2. **Lire TOUS les fichiers Markdown du repo** (hors `node_modules`, `.git`) :
   `find . -name "*.md" -not -path "*/node_modules/*" -not -path "./.git/*"`
   Un hook (`.claude/settings.json`) affiche leur liste à chaque prompt : **les lire tous en entier** (outil Read), même s'ils semblent déjà connus — un coéquipier a pu les modifier.
3. Vérifier dans `memory/TASKS.md` que la tâche demandée n'est pas déjà prise par un autre membre.

### ❓ Toujours poser des questions avant d'agir
Pour toute demande qui modifie le projet (code, base de données, design, périmètre), **poser des questions à l'utilisateur avant de coder** (outil AskUserQuestion), même si la demande paraît claire :
- reformuler ce qui a été compris et faire préciser les points ambigus (comportement attendu, périmètre, ce qui est exclu) ;
- signaler les recoupements avec la tâche d'un coéquipier et les migrations nécessaires ;
- n'écrire du code qu'une fois les réponses reçues ; reposer des questions si un nouveau choix apparaît en cours de route.

### 2. APRÈS chaque requête (même petite)
Mettre à jour la mémoire, **dans le même commit que le code** :
- `memory/JOURNAL.md` → **ajouter** une entrée (date-heure, membre, ce qui a été fait, fichiers touchés).
- `memory/TASKS.md` → changer le statut des tâches concernées.
- `memory/ARCHITECTURE.md` → si la structure, la stack, le modèle de données ou les routes ont changé.
- `memory/DECISIONS.md` → si une décision a été prise (techno, scope, design…), avec le pourquoi.
- `memory/PROJECT.md` → si la vision / le périmètre fonctionnel a changé.
- `README.md` → **à chaque changement visible** : fonction ajoutée, retirée ou modifiée, nouvelle page, nouvelle étape d'installation (migration particulière, script, clé, dépendance). Pas pour un correctif ou un ajustement de style. Il s'adresse d'abord au **jury** (ce que fait l'appli, fonctions principales, limites), puis à l'équipe (installation) : corriger les lignes périmées, rester court, ne décrire que ce qui est codé, jamais de secret ni d'adresse email (dépôt public).

Puis **faire soi-même** le commit + push (voir section Git ci-dessous) — ne pas juste le proposer.

### 3. Git — c'est Claude qui s'en charge (tout sur `main`)
Repo : https://github.com/sachabj/hackathon18.git · branche unique : `main`.
- **Début de requête** : `git pull --rebase origin main`.
- **Fin de requête, automatiquement, sans demander** :
  1. mise à jour de la mémoire (section 2)
  2. `git add -A`
  3. `git commit -m "<type>: <résumé court> (<prénom>)"` — types : feat, fix, docs, style, refactor, chore
  4. `git pull --rebase origin main`
  5. `git push origin main`
- **Conflit pendant le rebase** : le résoudre en gardant le travail des deux côtés (fichiers mémoire : fusionner, ne jamais supprimer l'entrée d'un autre), puis `git rebase --continue`. Si le conflit touche du code d'un autre et que la bonne fusion n'est pas claire → demander à l'utilisateur.
- **Interdits** : `git push --force`, `git reset --hard`, réécrire l'historique de `main`, committer des secrets (`.env`, clés API).
- Si le push échoue (droits / authentification) : le signaler clairement à l'utilisateur avec l'erreur.

### 🚀 Déploiement : seulement quand on le décide
Le quota Vercel est limité (déjà épuisé le 27/11). Le déploiement automatique au push est coupé (`vercel.json`) : ne pas le réactiver.
- **Tester en local** (`npm run dev`, puis `npm run lint && npm run build`) ; commit et push restent systématiques.
- **Ne jamais déployer de sa propre initiative** : seulement quand l'utilisateur le demande ou accepte la proposition.
- **Proposer un déploiement** à la fin d'une réponse si la ligne « Dernier déploiement » de `memory/TASKS.md` date de **plus de 30 min** et que du code a changé depuis (`git diff --stat <commit déployé> HEAD -- src public next.config.ts package.json package-lock.json`), ou juste après une grosse fonction. Une ligne suffit ; pas de proposition si rien n'a changé.
- Le déploiement se fait depuis le poste de **Justin** (procédure dans `memory/ARCHITECTURE.md`) : les autres le lui demandent. Ensuite, mettre à jour la ligne « Dernier déploiement ».

### 4. Règles de cohabitation (4 Claude sur le même repo)
- Ne jamais réécrire/supprimer les entrées des autres dans `JOURNAL.md` / `DECISIONS.md` : **ajout uniquement**.
- En cas de conflit git sur un fichier mémoire : garder les deux versions (fusionner), ne rien perdre.
- Ne pas remanier du code d'un autre membre sans que ce soit noté dans `TASKS.md`.
- Identifier le membre courant : lui demander son prénom s'il n'est pas connu (`git config user.name` sinon).

## 🗂️ Carte de la mémoire
| Fichier | Contenu |
|---|---|
| `memory/PROJECT.md` | Idée, cible, fonctionnalités, périmètre MVP |
| `memory/ARCHITECTURE.md` | Stack, arborescence, modèle de données, API |
| `memory/DECISIONS.md` | Journal des décisions (ADR light) |
| `memory/TASKS.md` | Qui fait quoi, statut, planning jusqu'à la deadline |
| `memory/JOURNAL.md` | Historique chronologique de chaque requête |

## Conventions
- Langue : français pour la doc et l'UI, anglais pour le code (noms de variables/fonctions).
- Garder les fichiers mémoire **courts et à jour** : préférer modifier une ligne obsolète plutôt qu'empiler.
