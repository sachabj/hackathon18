# PROJECT — ShareWood ✅

> Le Waze des étudiants. Légende : ✅ = validé par l'équipe · 💡 = proposition, à valider

## Pitch ✅
Comme Waze, mais au lieu de signaler les radars et les contrôles, **on signale les bons plans étudiants**.
Un utilisateur peut **signaler** des offres et/ou **être informé** des offres autour de lui, selon ses préférences et sa zone.

## Cible ✅
Étudiants. Zone de démo : **Bruz et Ker Lann** (campus ENSAI).

## Catégories ✅
| Catégorie | Exemples | Où l'afficher |
|---|---|---|
| 🍔 Restaurants | offre étudiante McDo | carte |
| 🛒 Grandes surfaces | paquets de pâtes en promo à Intermarché | carte |
| 🚆 Transports : avion / train / bus / covoiturage | carte Avantage SNCF, covoit' Bruz→Rennes | fil (souvent sans lieu) |
| 🎓 Bourses & aides | éligibilité CROUS | fil |
| ⚽ Licence de sport | licence à prix réduit | carte ou fil |
| 🎬 Activités | ciné, piscine… | carte |

**Conditions** (pas des catégories) : carte étudiante, **Carte Sortir** (Rennes Métropole), boursiers, moins de 26 ans — badges sur l'offre. Une offre peut avoir un **lien** (« Voir l'offre »).

Deux sortes de bons plans : **localisés** (sur la carte) et **sur une zone ou nationaux** (dans le fil uniquement).

## Fonctionnalités validées ✅
1. **Préférences** : zone principale (+ GPS facultatif) et zones suivies (Bruz, Ker Lann, Rennes), transports, budget (Serré / Équilibré / Confort), pôles de dépenses par ordre de priorité, activités préférées, longs trajets (retours chez les parents, envie de voyager) → fil **« Pour toi »** avec score de compatibilité et raisons.
2. **Score de fiabilité** sur chaque bon plan en code couleur (ex : pastille verte « Très fiable · confirmé il y a 2 h par 6 étudiants » ; rouge « Douteux », jaune « À vérifier », vert clair « Fiable »), calculé à partir des « J’y suis allé » (confirmation) et des « Plus dispo » (décochables), les votes récents comptant plus.
   - Le bon plan est masqué quand le score passe sous un seuil. **Le nombre de votes nécessaire s'adapte au nombre d'utilisateurs actifs dans la zone** : peu d'utilisateurs → peu de votes suffisent.
   - Si **le commerçant indique que l'offre n'existe plus** → elle est retirée immédiatement.
3. **Accès complet pendant 7 jours après chaque contribution** (signaler ou confirmer un bon plan remet le compteur à 7 jours). Compteur visible : « 🔓 Accès complet encore 4 jours ».
   - Accès limité pour un inactif ✅ : les nouveaux bons plans ne lui sont visibles qu'**après 24 h**.
4. **Niveaux d'utilisateur selon l'activité** (ex : 🔥 Très actif · ✅ Actif · 💤 Peu actif · 😴 Inactif) avec des **messages d'encouragement par catégorie** (ex : « Tu es le roi des bons plans transport 🚆, encore 2 signalements pour passer Très actif ! »).
5. **Favoris ❤️** : liker un bon plan pour l'enregistrer et ne pas le perdre.
6. **Rappels de dates limites** pour les bons plans à échéance (dossier CROUS, renouvellement de la Carte Sortir, inscriptions au sport), en particulier ceux mis en favori.
7. **Notification sur place** : « Un bon plan à signaler ici ? » / « Ce bon plan est-il toujours dispo ? ». Démo avec un bouton **« 📍 Simuler ma position »** (le web ne peut pas suivre la position en arrière-plan ; l'app mobile utiliserait le géofencing natif).
8. **Espace commerçant** : les enseignes publient leurs offres avec un badge « ✔ Offre officielle », peuvent les modifier et les déclarer terminées, voient leurs statistiques, retirent les signalements d'étudiants périmés près de chez eux (≤ 75 m, même catégorie) et payent pour une mise en avant (9,90 € / 7 jours, paiement simulé ; = **modèle économique** du pitch). Compte commerçant choisi à l'inscription.

## Évolutions décidées (tâches 18 à 26 codées, 27 en cours : voir `TASKS.md`) ✅
- Accueil avec barre de recherche et onglets « Pour toi », Voyager, Aides & bourses, Culture & sport, Quotidien ; carte et toutes les offres dans un onglet « Recherche ».
- Cartes : % de fiabilité à la place du % de compatibilité.
- Inscription : localisation ou pays → ville-campus, fréquence de voyage + moyens, « Boursier ? ».
- Publication : pré-remplissage IA conservé, doublons cherchés sans IA (« Bon plan validé »), plus de relecture IA.

## Refusé ❌
- Comptes Asso / BDE.

## Périmètre de la démo (samedi 13h)
### MVP
- [ ] Carte Bruz / Ker Lann + fil des bons plans sans lieu, filtres par catégorie
- [ ] Publier un bon plan (localisé / zone / national)
- [ ] Votes 👍/👎 + score de fiabilité
- [ ] Onboarding des préférences (catégories + zones)
- [ ] Accès 7 jours après chaque contribution + niveau d'utilisateur + messages d'encouragement
- [ ] Favoris ❤️
- [ ] Notification sur place simulée

### Si le temps le permet
- [ ] Espace commerçant (badge officiel, « n'existe plus »)
- [ ] Rappels de dates limites
- [ ] Vraies notifications push (PWA)

## Compte ✅
- **Un compte est obligatoire pour tout**, y compris pour consulter.
- **Publications anonymes** ; page « Compte et confidentialité » (sécurité, mes données, suppression) et politique de confidentialité.
- **Crédits et badges** (à faire) : gagnés en interagissant avec les offres (publier > confirmer) ; badges, progression, avantages d'entreprises partenaires.
