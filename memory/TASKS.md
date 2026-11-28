# TASKS — état du projet et qui fait quoi

_Réécrit le 28/11 à partir de la lecture du code (tâche 74, Justin). Historique : `JOURNAL.md`. Les numéros de tâche sont conservés._

Statuts : `TODO` · `EN COURS (prénom)` · `À TESTER` (codé, pas essayé sur la vraie base) · `FAIT` · `BLOQUÉ (raison)`

**Avant de coder** : mettre `EN COURS (prénom)` ici et pousser ; poser les questions prévues par `CLAUDE.md`.

## 🚀 Mise en ligne (à la demande, voir `CLAUDE.md`)
- **Dernier déploiement : `11275a3`, 28/11 à 02h57** (Justin) → **https://sharewood-ensai.vercel.app** (site à utiliser pour la démo) : revue, micro-animations (75) et défauts corrigés (76).
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
| Publication | Lieu via Photon, saisie rapide, photo ou texte → formulaire (Gemini ou Claude), photo de preuve, doublons sans IA (6, 27, 45) | Matteo, Justin | publication et Gemini essayés (Matteo) ; photo affichée, appareil photo, nouvel écran avec la vraie IA |
| Réactions et fiabilité | « J'en ai profité » / « Plus dispo », poids des étudiants, tri Hot, sur place à 500 m, « Douteux » puis retrait, jamais sur ses offres (7, 29, 32, 33, 51, 58, 66, 69) | Matteo, Sacha, Justin | 29, 33, 51, 69 |
| Inscription | Me localiser ou pays → ville, transports, voyages, budget, bourse, Carte Sortir, priorités, « Pour toi » (9, 20, 21, 22) | Sacha, Justin | vraie base et téléphone |
| Favoris | Par catégorie, dans « Ciblés » (8) | Anne-Lise | vraie base |
| Ciblés | Flèches, grades, activité, mes bons plans, boutique et bons à QR code ; aucun accès limité (10, 17b, 42, 43, 44, 46, 47) | Sacha | testé en local seulement |
| Profil | Étudiants aidés, parrainage, menu des réglages, localisation retirable, aide et bug (49, 64, 68) | Sacha, Justin | vraie base |
| Compte | Mot de passe, appareils, export, suppression, politique de confidentialité (17a) | Sacha | vraie base |
| Commerçant | Offres, retrait, statistiques, mise en avant, offres d'étudiants voisines (13) | Justin | vraie base |
| Ordinateur | Navigation en haut, liste et carte côte à côte, colonnes (48) | Justin | vu avec un faux Supabase seulement |
| Documentation | `docs/ALGORITHMES.md` (40), `README.md`, revue du dépôt (74) | Matteo, Justin | — |
| Défauts | D3 à D5, D7 à D9, D11 à D14 (76) : voir partie 4 | Justin | vraie base et téléphone |
| Tâches importantes | Notification sur place simulée (11), « Sport » (55), même gain des réactions (57, migration **026**), carte qui suit la recherche (60), offre publiée montrée (62) | Justin | vraie base et téléphone ; **lancer 026** |

Tâches remplacées : 16 (dans 26), 18 (par 30), 25 et 31 (puis 67), 56 (par 67), 63 (par 68). Défauts corrigés avant la revue : D1 (vote sur son offre), D2 (copie locale du script de démo), D6 (lecteurs d'écran), D10 (tuile choisie).

## 2. 🟡 En cours / Partiel
| # | Sujet | Ce qui existe | Ce qui manque | Qui |
|---|---|---|---|---|
| 12 | Données de démo | `reset_demo.sql` et `seed_arrows.sql`, rejoués 2 fois en local le 28/11 | les lancer sur la vraie base (voir C1) ; revérifier les prix sourcés | EN COURS (Justin) |
| 65 | Vraies offres | script `scripts/import_sources.mjs`, `import_sources.sql` (54 offres), badge « Source officielle » | lancer l'import sur la vraie base ; Burger King, McDonald's, Carrefour, Super U, Auchan non publiés (non confirmés) | À TESTER (Justin) |
| 15 | Pitch | 7 diapos LaTeX (`pitch/`), diapo 2 corrigée le 28/11 | vidéo d'1 min maximum, répétition | À TESTER (Justin) |
| 42 | Récompenses | boutique, échanges, bons | partenaires fictifs ; « Avant-Première » sans offre flash ; aucun tirage ; le commerçant ne peut pas vérifier un code | Sacha |
| 68 | Notifications | section « bientôt », interrupteurs désactivés | aucune alerte envoyée ; « précisions sur une offre » non faites | Sacha |
| 13 | Mise en avant | fonctionne (9,90 € / 7 jours) | paiement simulé ; statut de commerçant non vérifié | Justin |
| 17a | Confidentialité | page à jour | contact **fictif** (`PRIVACY_CONTACT`) à remplacer avant une vraie mise en service | Sacha |

## 3. 📋 Reste à faire

### 🔴 Critique (avant la démo de 13h)
| # | Action | Qui |
|---|---|---|
| C0 | Lancer `025_limits.sql` | FAIT (Justin, 28/11) |
| C0b | **Lancer `026_same_reaction_gain.sql`** (+10 / +3 pour les deux réactions ; sans elle, l'appli affiche +10 alors que la base verse encore +15 / +5) | Justin |
| C1 | **Préparer la vraie base**, dans cet ordre : `reset_demo.local.sql` (⚠️ efface les comptes non listés), `seed_arrows.sql` (le jour de la démo), `import_sources.sql` | Justin |
| C2 | Vérifier les migrations 013, 015, 019, 021 et 025 | FAIT (Justin, 28/11) : toutes présentes |
| C3 | **Essai complet en ligne, sur téléphone** : inscription, accueil, recherche, carte, publication avec photo, réactions, Flèches, boutique, profil, lien partagé, espace commerçant | tous |
| C4 | **Vidéo du pitch** (1 min maximum) et répétition | équipe |
| C5 | Gel du code à 11h, dernier déploiement | Justin |

### 🟠 Important
Toutes faites (11, 55, 57, 60, 62 : Justin, 28/11 ; voir partie 1). Reste à lancer la migration 026 (C0b).

### 🟢 Bonus
| # | Tâche | Taille | Statut |
|---|---|---|---|
| 14 | Rappels de dates limites | M | TODO |
| 41 | Filtre « Ouvert maintenant » : aucune donnée d'horaires (saisie + migration, ou service externe) | M | TODO, remis à plus tard (Sacha) |
| 50 | Application en anglais : textes écrits en français dans le code ; à décider : toute l'appli ou les pages principales | G | EN COURS (Sacha) : parcours étudiant en anglais, choix FR / EN (profil, connexion) |
| 52 | N'importe quelle ville de France à la 1re connexion : zones en base, carte, « Pour toi », publication « Une ville » ; Photon possible ; migration | G | EN COURS (Sacha) : recherche de ville (Photon) + grandes villes, principale + 4 autres ; migration **027** réservée |
| 53 | Nouvelles icônes (« emojis » demandés aussi, mais la règle actuelle est : aucun emoji) | P | TODO (Anne-Lise) |
| 54 | « Tes aides » valables partout en France (la Carte Sortir est propre à Rennes) ; lié à 52 | M | EN COURS (Sacha) : Carte Sortir seulement pour la région rennaise |
| 59 | Récompense de publication différée (délai et nombre d'étudiants à choisir) ; migration ; aujourd'hui +50 sur place, +20 sans lieu | M | TODO (Sacha) |
| 70 | **Compétition entre écoles** : classement des écoles (Flèches cumulées ou par membre) ; `preferences.school` est un texte libre → liste d'écoles à prévoir ; RPC d'agrégat (migration) | M | TODO (idée retenue par Matteo, non cadrée) |
| 71 | **Signaler un contenu** (arnaque, inapproprié, mauvaise info), distinct de « Plus dispo » : motifs, table (migration), seuil de masquage, lecture comme `support_messages` | M | TODO (idée retenue par Matteo, non cadrée) |
| 72 | **Alertes** « préviens-moi quand une offre correspond à… » : prototype web = alertes enregistrées, vérification à l'ouverture et en direct (Supabase Realtime), notification du navigateur appli ouverte ; vrai push hors délai | M à G | TODO (idée retenue par Matteo, non cadrée) |
| 73 | **Manifest (PWA installable)** : « Ajouter à l'écran d'accueil », plein écran, icône ; aucun manifest aujourd'hui ; nécessaire aux notifications sur iPhone | P | TODO (idée retenue par Matteo, non cadrée) |
| 75 | **Micro-animations** : réaction (rebond, compteur qui défile, fiabilité en fondu, « +N » qui vole vers le solde), fiche qui monte du bas et se ferme en glissant la poignée, cartes en cascade (8 premières, au chargement et aux filtres), cœur qui grossit avec un anneau. Coupées si « moins d'animations ». `lib/motion.ts`, `ArrowFlight.tsx` (layout), `ReactionBar`, `TrustBadge`, `DealSheet` (**Justin** : fermeture via `close()`, poignée), `DealCard` (**Anne-Lise** : cœur), listes de l'accueil, de Recherche et des favoris (`data-cascade`), `ArrowBadge` (`data-arrow-target`), `arrows.ts` (**Sacha** : champ `gain` des messages), `globals.css` | M | À TESTER (Matteo) : tsc, lint, build OK ; pas vu dans le navigateur ni sur téléphone ; sans migration |

## 4. 🐞 Bugs, points bloquants et vérifications

### Contrôles du 28/11 (après la tâche 76)
| Contrôle | Résultat |
|---|---|
| `tsc` (y compris variables et imports inutilisés) | OK |
| `npm run lint` | OK, aucun avertissement |
| `npm run build` | OK |
| Postgres local : `schema.sql` contre schéma d'origine + migrations 002 à 025 | identiques, sauf l'ancienne valeur `carte_sortir` (attendu) |
| Postgres local : `reset_demo` → `seed_arrows` → `import_sources`, 2 fois | OK |
| Postgres local : 75 appels de l'app avec les droits d'un utilisateur, 15 contrôles de la 025 | OK |
| Navigateur sans écran, faux Supabase : 19 contrôles des défauts (390 et 320 px) | OK |
| **Pas vérifié** | vraie base et téléphone |

### Variables d'environnement (`.env.example`)
| Variable | Rôle | Obligatoire | Sur Vercel |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | base et comptes | oui | oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé publique | oui | oui |
| `GEMINI_API_KEY` | assistant de publication (prioritaire) | non | oui |
| `GEMINI_MODEL` | modèle Gemini (défaut dans `lib/ai/assist.ts`) | non | non |
| `ANTHROPIC_API_KEY` | assistant si pas de clé Gemini | non | non |

### Vraie base
- **Présentes** : 002 à 025 (013, 015, 019, 021 et 025 vérifiées par Justin, 28/11). **À lancer : 026** (C0b).
- Requête de contrôle (SQL Editor, lecture seule ; `false` → lancer le fichier correspondant) :
```sql
select
  exists (select 1 from pg_policies where tablename = 'votes' and policyname = 'retirer son vote') as m013,
  not exists (select 1 from public.deals where title like '[Exemple]%') as m015,
  exists (select 1 from public.rewards where id = 'golden' and description like '%Ciblés%') as m019,
  exists (select 1 from pg_trigger where tgname = 'votes_presence') as m021,
  to_regprocedure('public.use_ai_quota()') is not null as m025,
  pg_get_functiondef('public.arrow_on_vote()'::regprocedure) not like '%else 15 end%' as m026;
```
- Relancer 018 si 009 ou 016 sont relancées ; 020 si 016 ou 018 ; 022 si 016 ou 018 ; 023 si 016, 018 ou 020.
- `import_sources.sql` : à relancer après chaque `reset_demo.sql`. `seed_arrows.sql` demande 016, 017, 020, 022, 023 et `reset_demo.sql`.
- Migration **027** réservée par Sacha (tâche 52). Prochaine : **028** (vérifier après un pull). Fichier dans `supabase/migrations/` + `schema.sql` + GRANT, puis la lancer dans le SQL Editor. Relancer 026 si 020 ou 023 sont relancées.
- Messages « Aide et signaler un bug » : Supabase → Table Editor → `support_messages`.

### Défauts
**Aucun défaut ouvert connu.** Corrigés le 28/11 (tâche 76), à essayer sur la vraie base et sur téléphone :
| # | Correction |
|---|---|
| D3 | Favori terminé : mention « Terminée », grisé, en bas de sa catégorie, sans réactions |
| D4 | Une réaction (carte, fil, fiche) met à jour la liste et le repère aussitôt ; l'ordre ne change qu'à la visite suivante |
| D5 | Échec d'un favori : message à l'écran |
| D7 | Titre : 100 caractères partout, et en base avec la 025 |
| D8 | Couleurs de l'application pour la barre du navigateur et les chargements |
| D9 | Assistant IA : 30 analyses par jour et par compte (**demande la 025**) |
| D11 | Barre du bas entière à 320 px |
| D12 | Offres douteuses échues retirées avant l'affichage commerçant et la recherche de doublons |
| D13 | Fiche d'une offre terminée : bandeau avec la raison, sans réactions ni « Y aller » |
| D14 | Inscription avec confirmation par email : message au lieu d'un retour muet |

### Cas limites et limites assumées
- La position vient du navigateur : falsifiable. Des comptes complices peuvent confirmer des offres bidon ou en retirer une (6 signalements en 48 h). Parrainage et « étudiants aidés » sont gonflables.
- Les signalements ne périment pas : 3 anciens suffisent à rendre une offre « Douteux ».
- **Démo** : loin de Bruz, pas de « Plus dispo » sur les offres de la carte ; pour montrer un gain sur place, être à moins de 500 m.
- Distances et durées à vol d'oiseau.

### Dette technique (signalée, à ne pas toucher avant la démo)
- Code de secours pour les migrations absentes (`lib/legacy.ts`, replis `PGRST202` ou colonne absente) : à retirer une fois la vraie base confirmée.
- Seuils écrits en TypeScript et en SQL (identiques au 28/11) : `rules.ts` ↔ 014 / 023, `arrows.ts` ↔ 020 / 023, `community.ts` ↔ 022, 75 m ↔ 005 / 009.
- `schema.sql` empile les migrations (certaines fonctions redéfinies jusqu'à 4 fois) : correct, mais long à lire.
- La fonction `my_influence()` reste en base sans être appelée. `PublishForm.tsx` fait près de 800 lignes.

---

## Règles à connaître avant de modifier le code
- **README.md** : à mettre à jour dans le même commit à chaque changement visible.
- **Algorithmes** (tri, compatibilité, Hot, recherche, fiabilité) : `docs/ALGORITHMES.md`, à mettre à jour avec chaque formule ou constante.
- Toute nouvelle donnée ou tout nouveau service externe → `src/app/confidentialite/page.tsx`.
- **Localisation** : toujours passer par `lib/location.ts` (`ensureLocationConsent` / `currentPosition`), jamais `navigator.geolocation` sans accord.
- **Réactions** : passer par `setReaction` / `vote()` (`engagement.ts`, RPC `react_to_deal`) ; elles sont exclusives et décochables. Après une réaction, `announceReactions` ; toute liste d'offres l'écoute (`onReactions` + `applyReactions`).
- **Fiabilité** : passer par `reliability()` / `dealTrustLevel()` (`rules.ts`) avec `deal.trust` (`withTrust()`). Offre terminée : `dealEndReason()` / `isDealHidden()`.
- **Carte d'un bon plan** : ne rien y rajouter sans en discuter. Pas de champ « montant » : le titre dit l'avantage (`price_level` gardé pour les filtres).
- **Carte Sortir** est une condition (`deals.requirements`), pas une catégorie. Liens : `lib/links.ts` (`normalizeLink` à l'écriture, `safeLink` à l'affichage).
- `deals.author_id` peut être `null` ; les profils des autres ne sont pas lisibles ; toute nouvelle colonne de `deals` ou `profiles` va dans les GRANT.
- Un compte commerçant ne voit pas les pages étudiantes (`RoleGate`) : tester avec un compte étudiant.
- Pas d'emoji dans l'app (`components/icons.tsx`, `CategoryIcon`, classes `.sw-*`, `DESIGN_SHAREWOOD.md`).
- `/profil` : prévenir Sacha ; garder `LogoutButton`.
- Next conserve les pages quittées : les effets sont relancés au retour (cartes Leaflet à démonter). L'avertissement « instant navigation » est coupé dans `next.config.ts`.
- Ordinateur : regarder aussi en large (`lg:`) ; un en-tête de page avec logo porte `lg:hidden`.

## Planning (deadline sam. 28/11 13h00)
- **Sam. matin** : C1 à C3, finitions
- **Sam. 11h–13h** : gel du code, vidéo, pitch, répétition
