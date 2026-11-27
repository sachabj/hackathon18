# TASKS — qui fait quoi

Statuts : `TODO` · `EN COURS (prénom)` · `FAIT` · `BLOQUÉ (raison)`

## Équipe
| Membre | Rôle |
|---|---|
| Sacha | Fil + filtres (tâche 5b) |
| Anne-Lise | Publication, votes, fiabilité, favoris (6, 7, 8) |
| Matteo | Accès 7 jours, niveaux, notif simulée (10, 11) |
| Justin | Squelette, BDD, déploiement (3, 4), carte (5a), puis commerçants / rappels (13, 14) |

✅ Répartition validée (ajustable) : **Justin** = squelette, BDD Supabase, déploiement · **Sacha** = fil + filtres (carte reprise par Justin) · **Anne-Lise** = publication, votes, fiabilité, favoris · **Matteo** = accès 7 jours, niveaux, notif simulée (préférences reprises par Sacha) · **tout le monde** = données de démo + pitch.

## Tâches
| # | Tâche | Statut |
|---|---|---|
| 1 | Mettre en place la mémoire partagée + git | FAIT |
| 2 | Valider la stack, le nom (Waze-Etu) et les propositions | FAIT |
| 3 | Squelette Next.js + déploiement Vercel (https://hackathon18-t1lb.vercel.app) | FAIT |
| 4 | BDD Supabase : schéma + migrations 002 et 003, test e2e OK | FAIT |
| 5a | Carte Bruz / Ker Lann + écran d'accueil (Justin) | FAIT |
| 5b | Fil + filtres par catégorie (Sacha) : section « Fil » de `src/app/page.tsx` | TODO |
| 6 | Formulaire de publication (local / zone / national) | TODO |
| 7 | Votes 👍/👎 + score de fiabilité | TODO |
| 8 | Favoris ❤️ | TODO |
| 9 | Préférences : parcours d'inscription personnalisé + fil « Pour toi » (repris de Matteo, avec son accord) | EN COURS (Sacha) |
| 10 | Accès 7 jours après contribution + niveaux + messages d'encouragement | TODO |
| 11 | Notif sur place simulée (« toujours dispo ? ») | TODO |
| 12 | Données de démo (vrais bons plans Bruz / Ker Lann / Rennes) | TODO |
| 13 | Espace commerçant (badge officiel, « n'existe plus ») | TODO |
| 14 | Rappels de dates limites | TODO |
| 15 | Pitch / slides (modèle économique commerçants) | TODO |

## Pour démarrer sa tâche
Chaque page a un fichier vide avec un commentaire `// Responsable` + `// TODO` : partir de là. Règles partagées dans `src/lib/rules.ts`, types dans `src/lib/types.ts`, catégories et zones dans `src/lib/constants.ts`.

## Planning indicatif (deadline sam. 28/11 13h00)
- **Ven. après-midi** : stack, squelette, BDD, déploiement
- **Ven. soir** : fonctionnalités MVP (liste, publication, votes)
- **Sam. matin** : carte, données de démo, polish UI
- **Sam. 11h–13h** : gel du code, pitch, répétition
