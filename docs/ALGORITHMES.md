# ShareWood — comment les bons plans sont classés et notés

Ce document explique, sans avoir à lire le code, **dans quel ordre les bons plans apparaissent** et **comment leur fiabilité est calculée**. Chaque règle est illustrée par un exemple chiffré. La dernière section indique où régler chaque paramètre.

> État au 28/11/2026. Si vous changez une formule, mettez ce fichier à jour.

---

## 0. Vocabulaire

| Terme | Signification |
|---|---|
| **Réaction** | Ce qu'un étudiant dit d'une offre. Il y en a deux, et un étudiant n'a qu'**une** réaction par offre. |
| **« J'en ai profité »** | Confirmation : l'offre existe. Enregistrée comme un vote **+1** (et un passage). |
| **« Plus dispo »** | Signalement : l'offre n'existe plus. Enregistré comme un vote **−1**. |
| **Décocher** | Toucher à nouveau sa réaction la retire. Les deux réactions s'excluent. |
| **Auteur** | Celui qui a publié l'offre. Il **ne peut pas** réagir à sa propre offre (règle imposée par la base). |
| **Sponsorisée** | Offre qu'un commerçant a payé pour mettre en avant (7 jours). Reconnaissable à son **cadre doré** et son étiquette « Sponsorisé ». |

---

## 1. Avant tout classement : quelles offres sont visibles ?

Une offre n'apparaît ni sur l'accueil, ni sur la carte, ni dans la recherche si (elle reste dans les favoris, marquée « Terminée », et son lien partagé affiche la raison) :

1. **sa date de fin est passée** ;
2. **elle a été retirée** par son auteur (« Plus dispo » dans « Ciblés », onglet Activité) ou par un commerçant voisin (offre d'étudiant à moins de 75 m, même catégorie) ;
3. **elle est retirée après des signalements** « Plus dispo » (étudiants différents, hors auteur ; offre sur la carte : signalement accepté seulement à 500 m au plus) :
   - au **3e**, elle devient **« Douteux »** (toujours visible, badge forcé) ;
   - **3 « J'en ai profité »** reçus ensuite la sauvent : les signalements précédents ne comptent plus et leurs Flèches en attente sont perdues ;
   - sinon, au bout de **2 semaines**, elle est retirée ;
   - **6 signalements en 48 h**, sans confirmation entre-temps, la retirent tout de suite.
   Le retrait est définitif ; les Flèches des signalements sont versées à ce moment-là. Si un signalement est décoché et qu'il en reste moins de 3, l'offre redevient normale.

**Aucune limite selon l'activité** : tous les étudiants voient toutes les offres, dès leur publication. Ne pas contribuer a une seule conséquence : on ne gagne pas de Flèches, donc pas de récompenses.

---

## 2. Ce qui passe en haut

### 2.1 Résumé par écran

| Écran | Ordre d'affichage |
|---|---|
| **Accueil, filtre « Pour toi »** (par défaut) | Sponsorisées → **compatibilité** (2.3) → plus récentes. Si aucune offre n'est compatible (ou profil non rempli) : toutes les offres, **les plus récentes d'abord**. |
| **Accueil, sans filtre principal** (« Pour toi » désactivé) | Toutes les offres : sponsorisées → compatibilité → plus récentes (sans profil : sponsorisées → plus récentes). |
| **Accueil, « Mes favoris »** | Échéance la plus proche d'abord (date limite, puis fin de l'offre), les offres sans date à la fin. |
| **Accueil, puces de catégorie** | Ne changent pas l'ordre : elles gardent seulement les offres des catégories choisies (plusieurs possibles). |
| **Recherche, avec des mots saisis** | Résultats exacts, puis « résultats proches ». Dans chaque groupe : sponsorisées → **pertinence** (2.5) → compatibilité. Le tri choisi dans les filtres (« Les plus proches », « Les moins chers ») remplace cet ordre. |
| **Recherche, sans saisie** (fil sous la carte ; la carte montre toutes les offres localisées, et seulement les résultats pendant une recherche) | Sponsorisées → **score « Hot »** (2.4) → plus récentes. |

La **fiabilité** (section 3) ne change pas l'ordre : elle sert à la couleur du badge. Seul le nombre de signalements peut faire disparaître une offre (retrait, section 1).

### 2.2 Les offres sponsorisées

Une offre est sponsorisée tant que sa mise en avant n'est pas terminée (7 jours après le paiement) et que le commerçant ne l'a pas retirée. Elle passe **avant les autres**, sans changer l'ordre entre les offres non sponsorisées (sauf dans « Mes favoris », quand « Pour toi » n'a rien à proposer, ou avec un tri par prix ou par distance). Elle n'est **jamais ajoutée** à « Pour toi » si elle ne correspond pas au profil.

### 2.3 Compatibilité « Pour toi »

Chaque offre reçoit un **score de 0 à 100** qui mesure à quel point elle correspond au profil de l'étudiant (rempli à l'inscription). Quatre critères donnent des points :

| Critère | Points max | Comment on les gagne |
|---|---|---|
| **Pôle de dépenses** | 40 | Catégorie suivie : 40 pour la priorité n°1, 36 pour la n°2, 32 pour la n°3, 28 au-delà. Un trajet utile pour quelqu'un qui voyage rapporte 36 (souvent), 28 (parfois) ou 16 (rarement). Une aide à laquelle l'étudiant a droit (boursier, Carte Sortir) rapporte 36. On garde le meilleur des trois. |
| **Localisation** | 25 | Offre dans un lieu **à portée** : 25 − 10 × (distance / portée). Hors de portée mais dans une zone suivie : 10. Sinon : l'offre est « hors de portée ». Offre valable sur une zone : 25 (zone principale), 20 (autre zone suivie). Offre nationale : 18. |
| **Budget** | 20 | Selon le niveau de prix de l'offre (gratuit, €, €€, €€€) et le profil budget, voir le tableau ci-dessous. |
| **Activité / transport** | 15 | L'offre concerne une activité aimée (ciné, piscine…) ou un transport que l'étudiant utilise. |

Points de budget :

| Profil \ niveau | Gratuit | € (< 10 €) | €€ (10–25 €) | €€€ (> 25 €) |
|---|---|---|---|---|
| Serré | 20 | 18 | 6 | 0 |
| Équilibré | 20 | 20 | 16 | 4 |
| Confort | 16 | 17 | 20 | 20 |

**Portée** = la plus grande distance couverte par les moyens de transport de l'étudiant : à pied 1,5 km, vélo 5 km, train 15 km, covoiturage 20 km, bus 12 km, voiture 25 km (3 km si rien n'est renseigné). Distances à vol d'oiseau depuis la position enregistrée, sinon le centre de la zone principale. La durée affichée (« ≈ 8 min à vélo ») = distance × 1,3 / vitesse du moyen.

**Score** = points gagnés / points des critères applicables × 100. Un critère qui ne s'applique pas (offre sans niveau de prix, profil sans activités…) **ne compte ni pour ni contre**.

**Entrer dans « Pour toi »** — il faut, sans compter le budget (le budget fait monter ou descendre une offre mais ne la retire jamais) :
- un score d'au moins **55** ;
- que l'offre soit à portée ;
- et qu'elle touche une catégorie suivie, une activité aimée ou un trajet utile.

Cas particuliers :
- **Bourses** : seulement si l'étudiant a répondu « oui » à « Boursier ? ».
- **Conditions « Carte Sortir » ou « Boursiers »** : répondu « non » → jamais dans « Pour toi » ; répondu « oui » → dans « Pour toi » dès que l'offre est à portée.

**Exemple.** Léa suit Restaurants (n°1), Grandes surfaces, Activités ; elle se déplace à vélo (portée 5 km) ; budget Serré. Offre : menu étudiant à 2 km, niveau €.
- Pôle : priorité n°1 → 40 / 40.
- Localisation : 25 − 10 × (2 / 5) = 21 / 25.
- Activité : l'offre n'a pas d'activité liée → critère ignoré.
- Sans budget : 61 / 65 = **94** ≥ 55, à portée, catégorie suivie → **dans « Pour toi »**.
- Avec le budget (Serré, € → 18 / 20) : score affiché = 79 / 85 = **93**.

### 2.4 Score « Hot » (page Recherche)

Inspiré de Reddit et Hacker News : il fait monter ce qui **marche en ce moment** et laisse descendre ce qui vieillit.

```
Hot = (1 + élan + quantité) / (âge en heures + 2) ^ 1,2
```

- **Élan (vitesse)** : chaque « J'en ai profité » ajoute +1, chaque « Plus dispo » retire 1,5 ; une réaction perd la moitié de son poids **toutes les 24 h**. Dix passages aujourd'hui valent bien plus que dix passages il y a une semaine.
- **Quantité (popularité)** : log2(1 + nombre total de « J'en ai profité »). Le logarithme évite qu'une vieille offre très confirmée écrase tout : passer de 1 à 3 passages compte autant que de 3 à 7.
- **Âge** : heures depuis la publication. L'exposant 1,2 règle la vitesse à laquelle une offre descend.

| Offre | Score Hot |
|---|---|
| Publiée il y a 6 h, 2 passages | 0,37 |
| Publiée il y a 1 h, aucune réaction | 0,27 |
| Publiée il y a 2 jours, 5 passages dans les 6 dernières heures | 0,07 |
| Publiée il y a 2 jours, les mêmes 5 passages mais il y a 40 h | 0,05 |
| Publiée il y a 6 h, 2 « Plus dispo » | négatif → tout en bas |

Effet voulu : une offre neuve a sa chance d'être vue, puis seules celles que les étudiants confirment restent en haut. Effet connu : une offre toute neuve sans réaction passe devant une offre de 2 jours très confirmée (baisser l'exposant pour l'éviter).

L'ordre est calculé **au chargement de la page** : une réaction met à jour tout de suite les compteurs et la fiabilité, sans déplacer les cartes ; le nouvel ordre apparaît à la visite suivante.

### 2.5 Recherche par mots (page Recherche)

La recherche se fait dans l'application (la saisie n'est envoyée à aucun service).

1. **Tous les mots utiles sont exigés** (les petits mots comme « de », « le » sont ignorés), sans tenir compte des accents, des majuscules ni du pluriel.
2. Chaque mot est cherché dans les champs de l'offre, avec un **poids par champ** : titre 10, lieu 6, catégorie / activités / conditions 4, description 3, zone 2.
3. **Qualité de la correspondance** : mot entier ×1 (les abréviations courantes comptent comme le mot entier : « ciné » = « cinéma », « resto » = « restaurant », « mcdo » = « McDonald's », « covoit », « muscu ») ; début de mot ×0,8 (« pizz » → « pizza ») ; milieu de mot ×0,6, à partir de 5 lettres ; **mot proche** ×0,5 (« kebab » → « restaurant », liste écrite à la main) ; **faute de frappe** ×0,4 (1 faute dès 4 lettres, 2 dès 8, seulement si le mot tel quel n'existe dans aucune offre).
4. La **pertinence** d'une offre = somme, pour chaque mot, de son meilleur score. Une offre trouvée uniquement grâce à un mot proche ou une faute va dans « Résultats proches », après les résultats exacts.
5. **Expressions comprises** : « gratuit », « pas cher », « près de moi »… ne sont pas cherchées comme des mots, elles activent le filtre de prix ou le tri par proximité.

Exemple : avec « ciné », « Ciné à 7,80 € » et « Cinéma Arvor : 7,20 € » arrivent à égalité (titre, mot entier : 10), avant une offre où « cinéma » n'apparaît que dans la description (3).

---

## 3. Fiabilité d'une offre

Objectif : dire en un coup d'œil si l'offre existe encore, **à la manière de Waze**. Waze ne croit pas tous les signalements de la même façon : il tient compte de l'expérience de celui qui signale, de l'âge du signalement, et retire vite un danger que plusieurs conducteurs disent disparu. ShareWood applique les mêmes idées.

La fiabilité est affichée par une **pastille de couleur avec un mot**, jamais en pourcentage :

| Score | Pastille |
|---|---|
| ≥ 0,85 | vert foncé **Très fiable** |
| ≥ 0,65 | vert clair **Fiable** |
| ≥ 0,40 | jaune **À vérifier** |
| < 0,40 | rouge **Douteux** |
| aucune réaction | lilas **Nouveau** |

### 3.1 Le poids d'un étudiant

Chaque étudiant a un **poids entre 0,5 et 2** : sa réaction compte d'autant plus qu'il est fiable. Il est calculé **par la base de données** et n'est jamais montré.

```
poids = justesse × activité × ancienneté      (borné entre 0,5 et 2)
```

- **Justesse** = 0,4 + 0,9 × (a + 2) / (n + 3)
  - *n* = nombre de ses réactions qu'on peut juger : offres où au moins 2 autres étudiants ont réagi et où leur avis net n'est pas partagé à égalité ;
  - *a* = parmi elles, celles qui vont **dans le même sens que les autres**.
  - Le « + 2 / + 3 » donne aux nouveaux une justesse neutre (2/3, soit un facteur 1,0) qui évolue avec leurs avis. Celui qui dit souvent « Plus dispo » à tort descend vers 0,4 ; celui qui a toujours raison monte vers 1,3.
- **Activité** = 1 + 0,5 × min(1, ln(1 + c) / ln(21)), où *c* = publications + réactions des **30 derniers jours** : de 1 (inactif) à 1,5 (20 contributions ou plus).
- **Ancienneté** : compte de **moins de 3 jours** → × 0,6 (un compte créé pour l'occasion pèse peu).

Exemples (calculés sur une base de test) :

| Étudiant | Justesse | Activité 30 j | Ancienneté | Poids |
|---|---|---|---|---|
| Ancien, 5 avis jugés, tous dans le sens des autres | (5+2)/(5+3) = 0,875 | 5 | 30 j | **1,54** |
| Ancien, 5 avis jugés, 1 seul dans le sens des autres | (1+2)/(5+3) = 0,375 | 5 | 60 j | **0,95** |
| Compte créé hier, 1 réaction | neutre | 1 | 1 j | **0,67** |

Ce poids n'est **affiché nulle part** : il sert seulement à la fiabilité. Il est distinct du **grade** montré sur la page « Ciblés », qui dépend des Flèches gagnées.

### 3.2 La masse d'une réaction

Chaque réaction pèse :

```
masse = poids de l'étudiant × 0,5 ^ (âge en heures / 48)  × 1,5 si c'est un « Plus dispo » plus récent que la dernière confirmation
```

- **Le temps compte** : une réaction perd la moitié de sa masse **toutes les 48 h**.
- **Le dernier mot compte** : un « Plus dispo » arrivé **après** le dernier « J'en ai profité » pèse 1,5 fois plus. Une offre qui vient de se terminer tombe vite, même si elle a beaucoup de vieilles confirmations.

### 3.3 Le score

```
score = (masse des « J'en ai profité » + 0,5) / (masse totale + 1)
```

Le « + 0,5 / + 1 » est un **a priori** : sans information, on considère l'offre à 50 % (« À vérifier »). Comme les masses fondent avec le temps, une offre qui n'est plus confirmée **redescend d'elle-même** vers « À vérifier » : c'est la **confiance qui s'érode**.

Exemples (poids 1 pour tous, pour simplifier) :

| Situation | Score | Pastille |
|---|---|---|
| 1 « J'en ai profité » il y a 1 h | 0,75 | Fiable |
| 5 « J'en ai profité » dans les 5 dernières heures | 0,91 | Très fiable |
| 10 « J'en ai profité », tous il y a 7 jours | 0,73 | Fiable |
| Les mêmes 10, il y a 14 jours | 0,54 | À vérifier |
| 3 « J'en ai profité » il y a 3 jours, puis 1 « Plus dispo » il y a 1 h | 0,44 | À vérifier |
| 2 « Plus dispo » dans les 2 dernières heures | 0,13 | Douteux |

Avec les poids réels : sur une offre confirmée par deux étudiants « Experts » et contredite par un étudiant souvent dans l'erreur, la confirmation l'emporte nettement plus qu'avec un simple décompte.

### 3.4 Les compteurs des boutons

Les boutons affichent **« J'en ai profité (12) »** et **« Plus dispo (2) »** : ce sont les **nombres bruts de réactions des 30 derniers jours**, sans pondération, pour rester compréhensibles. La couleur de la pastille, elle, est pondérée (poids + temps) : les deux peuvent donc différer légèrement.

### 3.5 Disparition d'une offre

La fiabilité ne masque rien. Une offre disparaît seulement après des signalements « Plus dispo » (voir section 1), ou si elle est expirée ou retirée.

### 3.6 Si la base n'est pas à jour

Les poids nécessitent la migration `014_voter_weights.sql`. Sans elle, l'application applique **exactement la même formule avec un poids de 1 pour tout le monde**.

---

## 4. Limites connues

- Les distances et durées sont estimées **à vol d'oiseau** (× 1,3), sans calcul d'itinéraire.
- Le score « Hot » utilise les réactions **sans le poids** des étudiants.
- La fiabilité n'intervient pas dans l'ordre des offres (seulement dans la couleur).
- Une offre toute neuve passe devant une offre de 2 jours très confirmée sur la page carte (2.4).
- La position ne pondère pas la fiabilité. Un « J'en ai profité » fait loin ou sans position compte autant qu'un autre ; un « Plus dispo » sur une offre de la carte n'est accepté que sur place (section 6).

---

## 5. Où régler (pour l'équipe)

| Paramètre | Valeur | Fichier |
|---|---|---|
| Poids des critères de compatibilité, seuil « Pour toi » (55), points de budget, de voyage, d'aide | 40 / 25 / 20 / 15 … | `src/lib/matching.ts` (`WEIGHTS`, `FOR_YOU_MIN_SCORE`, `BUDGET_POINTS`, `TRAVEL_POINTS`, `AID_POINTS`) |
| Portée et vitesse de chaque moyen de transport | 1,5 km à pied… | `src/lib/constants.ts` (`TRANSPORT_MODES`) |
| Score Hot : demi-vie 24 h, poids d'un signalement 1,5, exposant 1,2 | | `src/lib/hot.ts` (`HOT`) |
| Recherche : poids des champs, mots proches, abréviations | | `src/lib/search.ts` (`fields`, `RELATED`, `SAME`) |
| Fiabilité : demi-vie 48 h, « dernier mot » × 1,5, a priori 0,5 | | `src/lib/rules.ts` **et** `supabase/migrations/014_voter_weights.sql` (à changer aux deux endroits) |
| Seuils de couleur (0,85 / 0,65 / 0,40) | | `src/lib/rules.ts` (`TRUST_LEVELS`) |
| Poids d'un étudiant (justesse, activité, ancienneté, bornes 0,5–2) | | `supabase/migrations/014_voter_weights.sql` (`voter_stats`) |
| Fenêtre des compteurs (30 jours) | | `src/lib/rules.ts` (`COUNT_WINDOW_DAYS`) |
| Retrait des offres (3 / 3 / 14 jours / 6 en 48 h) | | `src/lib/rules.ts` (`DOUBT_REPORTS`…) **et** `supabase/migrations/023_doubtful_deals.sql` |

---

## 6. Les Flèches et la localisation

| Action | Offre sur la carte | Offre sans lieu précis |
|---|---|---|
| Publier un bon plan | +50, **sur place** | +20 |
| 3 confirmations reçues (si la publication a rapporté) | +30 | +10 |
| « J'en ai profité » | +10, **sur place** | +3 |
| « Plus dispo » (versées au retrait de l'offre) | +10, **sur place** | +3 |

- **Sur place** : position partagée à **500 m** au plus du lieu (distance à vol d'oiseau). Une position imprécise à plus de 500 m compte comme absente. Sinon : la publication et « J'en ai profité » sont enregistrés sans Flèches, et « Plus dispo » est **refusé** sur une offre de la carte.
- Publication : la vérification se fait dans les 15 minutes qui suivent, une seule fois.
- Série de 3 jours ou plus : gains × 1,5 (arrondi). Au plus 5 votes et 3 publications récompensés par jour.
- La position n'est jamais enregistrée par ces calculs.

Réglages : `supabase/migrations/020_location_rules.sql`, `021_gone_on_site.sql` et `026_same_reaction_gain.sql` (montants des réactions), **et** `src/lib/arrows.ts` (`ARROWS`, `ARROWS_NO_PLACE`), rayon aussi dans `src/lib/constants.ts` (`NEARBY_M`).

---

## 7. Étudiants aidés et parrainage

**Étudiants aidés** (profil) = nombre de **personnes différentes** (étudiants, hors soi) ayant fait au moins un de ces gestes : confirmer un de mes bons plans (« J'en ai profité »), le mettre en favori, toucher « Y aller » dessus, ouvrir un lien que j'ai partagé, ou ouvrir un lien vers mon offre partagé par quelqu'un d'autre. Une personne ne compte qu'une fois ; « grâce à tes bons plans » (gestes sur mes offres) + « grâce à tes partages » (les autres) = total. Un favori retiré ou une offre supprimée ne compte plus.

Mes « Plus dispo » confirmés (offre retirée) sont affichés **à part** : on ne sait pas qui a évité le déplacement.

**Parrainage** : +100 Flèches au parrain et +50 au filleul à la **première publication ou réaction** du filleul ; au plus 10 parrainages payés par parrain (le filleul reçoit toujours ses 50). Sans série ni plafond quotidien ; ces Flèches comptent pour le grade.

Réglages : `supabase/migrations/022_profile_impact_referral.sql` (`my_impact`, `referral_on_activity`) et `src/lib/community.ts` (`REFERRAL`).
