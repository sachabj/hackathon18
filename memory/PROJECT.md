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
| ⚽ Sport | licence ou salle à prix réduit | carte ou fil |
| 🎬 Activités | ciné, piscine… | carte |

**Conditions** (pas des catégories) : carte étudiante, **Carte Sortir** (Rennes Métropole), boursiers, moins de 26 ans — badges sur l'offre. Une offre peut avoir un **lien** (« Voir l'offre »).

Deux sortes de bons plans : **localisés** (sur la carte) et **sur une zone ou nationaux** (dans le fil uniquement).

## Fonctionnalités validées ✅
1. **Préférences** : zone principale (+ GPS facultatif) et zones suivies (Bruz, Ker Lann, Rennes), transports, fréquence de voyage et moyens, budget (Serré / Équilibré / Confort), aides (boursier, Carte Sortir), pôles de dépenses par ordre de priorité, activités préférées → filtre **« Pour toi »** (tri par compatibilité ; les cartes n'affichent que la distance).
2. **Score de fiabilité façon Waze** (l'avis des étudiants fiables et actifs pèse plus, la confiance s'érode sans confirmation récente, un « Plus dispo » récent pèse plus lourd ) sur chaque bon plan en code couleur (ex : pastille verte « Très fiable · confirmé il y a 2 h par 6 étudiants » ; rouge « Douteux », jaune « À vérifier », vert clair « Fiable »), calculé à partir des « J’en ai profité » (confirmation) et des « Plus dispo » (décochables), les votes récents comptant plus.
   - Au 3e « Plus dispo », le bon plan devient **« Douteux »** ; retiré après 2 semaines sans 3 « J'en ai profité », ou à 6 signalements en 48 h.
   - Si **le commerçant indique que l'offre n'existe plus** → elle est retirée immédiatement.
3. **Aucune limite selon l'activité** ✅ : tout le monde voit toutes les offres. Ne pas contribuer a une seule conséquence : pas de Flèches, donc pas de récompenses (l'ancien accès complet 7 jours et le retard de 24 h sont abandonnés).
4. **Niveaux d'utilisateur selon l'activité** (Très actif · Actif · Peu actif · Inactif) avec un message d'encouragement (le détail par catégorie a été retiré, tâche 47).
5. **Favoris ❤️** : liker un bon plan pour l'enregistrer et ne pas le perdre.
6. **Rappels de dates limites** (pas codés, tâche 14) pour les bons plans à échéance (dossier CROUS, renouvellement de la Carte Sortir, inscriptions au sport), en particulier ceux mis en favori.
7. **Notification sur place** (pas codée, tâche 11) : « Un bon plan à signaler ici ? » / « Ce bon plan est-il toujours dispo ? ». Démo avec un bouton **« 📍 Simuler ma position »** (le web ne peut pas suivre la position en arrière-plan ; l'app mobile utiliserait le géofencing natif).
8. **Espace commerçant** : les enseignes publient leurs offres avec un badge « ✔ Offre officielle », peuvent les modifier et les déclarer terminées, voient leurs statistiques, retirent les signalements d'étudiants périmés près de chez eux (≤ 75 m, même catégorie) et payent pour une mise en avant (9,90 € / 7 jours, paiement simulé ; = **modèle économique** du pitch). Compte commerçant choisi à l'inscription.

## Évolutions décidées et codées (tâches 18 à 27 ; état des essais dans `TASKS.md`) ✅
- Accueil avec des filtres « Pour toi », « Mes favoris » et une puce par catégorie (cumulables) ; carte et toutes les offres dans un onglet « Recherche ».
- Cartes : % de fiabilité à la place du % de compatibilité.
- Inscription : localisation ou pays → ville-campus, fréquence de voyage + moyens, « Boursier ? ».
- Publication : pré-remplissage IA conservé, doublons cherchés sans IA (« Bon plan validé »), plus de relecture IA.

## Refusé ❌
- Comptes Asso / BDE.

## Périmètre de la démo (samedi 13h)
Codé (état des essais dans `TASKS.md`) :
- [x] Carte, offres sans lieu, filtres par catégorie, recherche
- [x] Publier un bon plan (lieu précis / zone / partout)
- [x] Réactions « J'en ai profité » / « Plus dispo » et fiabilité
- [x] Parcours des préférences
- [x] Niveau d'activité
- [x] Favoris
- [x] Espace commerçant (badge, retrait, statistiques, mise en avant)

Pas codé :
- [ ] Notification sur place simulée
- [ ] Rappels de dates limites
- [ ] Vraies notifications push (PWA)

## Compte ✅
- **Un compte est obligatoire pour tout**, y compris pour consulter.
- **Partout en France et en anglais** ✅ (codé) : n'importe quelle ville à l'inscription (recherche ou localisation) ; Carte Sortir proposée seulement autour de Rennes ; interface étudiante en français ou en anglais.
- **Localisation** ✅ (codé) : facultative, avec accord retirable au profil ; sans elle les offres placées sur la carte ne rapportent pas de Flèches (500 m au plus) et ne peuvent pas être signalées « Plus dispo ». Offres sans lieu : petits montants.
- **Profil** ✅ (codé) : étudiants aidés (personnes uniques), parrainage (+100 / +50 à la première action, 10 payés au maximum), menu des réglages. Notifications annoncées « bientôt ».
- **Publications anonymes** ; page « Compte et confidentialité » (sécurité, mes données, suppression) et politique de confidentialité.
- **Les Flèches** ✅ (codé) : points gagnés en partageant et en réagissant (publier > confirmer), série, grades Éclaireur → Chasseur de bons plans → Robin des Étudiants (page « Ciblés »). **Boutique de récompenses** ✅ (codée) : bons chez des commerçants partenaires (fictifs en démo) avec QR code, avantages dans l'appli (Badge Doré, Avant-Première), tickets de tombola. Dépenser ne fait jamais baisser le rang. Le tout sur la page **« Ciblés »** (ex-Favoris).
