# PROJECT — Le "Waze des étudiants"

> Nom de l'app : _à définir_ (propositions plus bas)
> Légende : ✅ = validé par l'équipe · 💡 = **proposition de Claude, à valider**

## Pitch ✅
Comme Waze, mais au lieu de signaler les radars et les contrôles, **on signale les bons plans étudiants**.
Un utilisateur peut **signaler** des offres et/ou **être informé** des offres autour de lui, selon ses préférences et sa zone.

## Cible ✅
Étudiants. Zone de démo : **Bruz et Ker Lann** (campus ENSAI).

## Catégories de bons plans ✅
| Catégorie | Exemples | Géolocalisé ? |
|---|---|---|
| 🍔 Restaurants | offre étudiante McDo | oui (un point sur la carte) |
| 🛒 Grandes surfaces | paquets de pâtes en promo à Intermarché | oui |
| 🚆 Transports : avion / train / bus / covoiturage | carte Avantage SNCF, promo vols, covoit' Bruz→Rennes | souvent non (offre nationale ou trajet) |
| 🎓 Bourses & aides | éligibilité CROUS, aides au logement | non (offre nationale ou régionale) |
| ⚽ Licence de sport | licence à prix réduit, SUAPS | parfois |
| 🎟️ Carte Sortir | dispositif de Rennes Métropole | non (valable sur toute la zone) |
| 🎬 Activités | ciné, piscine, bowling… | oui |

→ Il faut donc deux types de bons plans : **localisés** (sur la carte) et **sur une zone ou nationaux** (dans le fil d'actus uniquement).

## Préférences utilisateur ✅
- Choix des **catégories suivies** (ex : un étudiant qui voyage beaucoup ne suit que Transports).
- Choix des **zones** où être notifié (ex : Bruz + Ker Lann).

## Système de récompenses ✅ (pour garder les utilisateurs actifs)
1. **Accès selon l'activité** : un utilisateur actif récemment (dans les 7 derniers jours) a accès à tout.
2. **Notification sur place** : quand on se trouve précisément dans un lieu (ex : on fait ses courses à Intermarché), on reçoit une notif du style « Un bon plan à signaler ici ? » ou « Ce bon plan est-il toujours dispo ? ».

## Pistes d'amélioration ✅
- Permettre aux **grandes enseignes et aux commerçants** de mettre eux-mêmes leurs bons plans sur la carte.

---

## 💡 Propositions de Claude (à accepter ou refuser)
1. **Fiabilité façon Waze** : chaque bon plan affiche « ✅ confirmé il y a 2 h par 6 étudiants ». Après 3 votes « plus dispo » sans confirmation récente, le bon plan est grisé puis masqué automatiquement.
2. **Que voit un inactif ?** Pour rendre la récompense concrète : un utilisateur inactif depuis plus de 7 jours voit les nouveaux bons plans **avec 24 h de retard** (ou floutés). Une seule action (signaler ou confirmer) débloque tout pour 7 jours. Un compteur affiche par exemple « 🔓 Accès complet encore 4 jours ».
3. **Points et niveaux** : +10 pour un bon plan signalé, +2 pour une confirmation, +5 si son bon plan est confirmé par d'autres. Niveaux à thème étudiant (Bizut → L3 → Master → Major de promo), badges, **classement par campus**.
4. **Rappels de dates limites** pour les bons plans sans lieu : dossier CROUS (DSE), renouvellement de la Carte Sortir, inscriptions au sport. L'app envoie une notif avant la date.
5. **Comptes Asso / BDE** : les associations étudiantes publient leurs événements et réductions (ça fait tout de suite du contenu pour la démo).
6. **Espace commerçant** (la piste d'amélioration) : badge « ✔ Offre officielle » + mise en avant payante, qui sert de **modèle économique** pour le pitch.
7. **Contrainte technique pour la notif sur place** : un site web ne peut pas suivre la position en arrière-plan. Pour la démo, on utilise un bouton « 📍 Simuler ma position » qui déclenche la notif dans l'app, et le pitch explique que l'app mobile utiliserait le géofencing natif.
8. **Noms possibles** : *BonPlanRadar*, *Wazétu*, *Plan B*, *Radar Étudiant*, *Bonplanz*.

---

## Périmètre de la démo (samedi 13h) — proposition
### MVP
- [ ] Carte de la zone Bruz / Ker Lann avec les bons plans localisés + fil des bons plans nationaux
- [ ] Filtre par catégorie (et sous-catégorie pour les transports)
- [ ] Publier un bon plan (titre, description, catégorie, lieu ou zone, date d'expiration optionnelle)
- [ ] Confirmer 👍 / signaler expiré 👎
- [ ] Onboarding des préférences : catégories et zones
- [ ] Récompense : statut actif ou inactif sur 7 jours, avec accès complet ou limité
- [ ] Notif sur place simulée (« Ce bon plan est-il toujours dispo ? »)

### Bonus
- [ ] Points, niveaux, classement
- [ ] Vraies notifications push (PWA)
- [ ] Espace commerçant / association
- [ ] Rappels de dates limites

## Questions ouvertes
- Nom de l'app
- Faut-il un compte pour simplement consulter ? (proposition : non pour consulter, oui pour signaler et voter)
- Que voit exactement un utilisateur inactif ? (voir proposition 2)
