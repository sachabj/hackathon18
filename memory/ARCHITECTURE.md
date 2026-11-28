# ARCHITECTURE

## Stack ✅
- **Next.js 16.4** (App Router, TypeScript, `src/`) + **Tailwind 4**, web app responsive
- **Supabase** (Postgres + auth + RLS) via `@supabase/supabase-js` + `@supabase/ssr`
- **Leaflet** + `react-leaflet` 5 ; fond de carte vectoriel **OpenFreeMap** (sans clé) via `maplibre-gl` 6 + `@maplibre/maplibre-gl-leaflet` (secours : tuiles OpenStreetMap)
- **Vercel** pour le déploiement
- **Assistant de publication** via la route serveur `/api/assist` : **Gemini** (`@google/genai`, `gemini-3.5-flash` par défaut, variable `GEMINI_MODEL` ; secours automatiques `gemini-3.5-flash-lite` puis `gemini-3.8-flash` si surcharge 503 / quota 429 / 404, 20 s max par essai) si `GEMINI_API_KEY` est définie, sinon **Claude** (`@anthropic-ai/sdk`, `claude-opus-5-5`) si `ANTHROPIC_API_KEY` l'est ; réponses JSON imposées par schéma
- ⚠️ **Next 16 a des changements cassants** (`middleware` → `proxy`, `cacheComponents` activé…) : lire `AGENTS.md` et la doc dans `node_modules/next/dist/docs/` avant d'utiliser une API Next.

## Repo
https://github.com/sachabj/hackathon18.git — branche unique `main`, commits/push faits par Claude (voir CLAUDE.md).

## Lancer le projet
```
npm install
cp .env.example .env.local   # puis coller l'URL et la clé anon Supabase
npm run dev                  # http://localhost:3000
npm run build && npm run lint   # à faire passer avant chaque push
```
Supabase (une seule fois) : SQL Editor → coller `supabase/schema.sql` → Run. Pour la démo, désactiver la confirmation par email (Authentication → Sign In / Providers → Email → « Confirm email » OFF).

## Déploiement (Vercel) : à la demande
`vercel.json` coupe le déploiement au push (`git.deploymentEnabled: false`). Site : **https://sharewood-ensai.vercel.app**, projet `sharewood-ensai`, équipe `hackathon-18` (compte de Justin), non relié à GitHub. Variables en production : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY` (secret) ; après un changement, redéployer.

Déployer (depuis un **clone neuf** de `main`, pour ne pas envoyer de fichiers locaux) :
```
git clone --depth 1 https://github.com/sachabj/hackathon18.git /chemin/temporaire && cd /chemin/temporaire
npx vercel login   # une fois
npx vercel link --yes --scope hackathon-18 --project sharewood-ensai
npx vercel deploy --prod --yes --scope hackathon-18
```
Puis noter le commit et l'heure dans `TASKS.md` (« Dernier déploiement »). Ancien projet (sachabj) : https://hackathon18-t1lb.vercel.app, figé.

## Arborescence
```
/
├── CLAUDE.md, AGENTS.md, README.md   # protocole Claude, règles Next 16 (générées par next), présentation
├── memory/                           # mémoire partagée du projet
├── pitch/                            # diapos du pitch en LaTeX Beamer (sharewood.tex, images/, PDF) ; voir pitch/README.md
├── docs/ALGORITHMES.md               # explication (équipe + jury) du classement des offres et de la fiabilité
├── supabase/schema.sql               # schéma complet (tables, triggers, RLS, GRANT) pour un projet neuf
├── supabase/migrations/              # modifs à appliquer sur la BDD existante (NNN_nom.sql)
├── .env.example                      # modèle de .env.local (jamais committé)
└── src/
    ├── proxy.ts                      # auth obligatoire : redirige vers /login sans session + rafraîchit le cookie
    ├── lib/
    │   ├── supabase/client.ts        # getSupabase() (navigateur), isSupabaseConfigured
    │   ├── types.ts                  # types TS alignés sur schema.sql
    │   ├── constants.ts              # CATEGORIES, SUBCATEGORIES, REQUIREMENTS (conditions), ZONES, MAP_CENTER
    │   ├── directions.ts             # lien d'itinéraire (Apple Plans / Google Maps) du bouton « Y aller »
    │   ├── links.ts                  # liens d'offre : normalizeLink (saisie), safeLink (affichage http(s) seul), splitLinks (URL du texte)
    │   ├── legacy.ts                 # normalizeDeal : ancienne catégorie carte_sortir → Activités + condition (avant 012)
    │   ├── rules.ts                  # règles métier : fiabilité, archivage, niveaux d'activité
    │   ├── rewards.ts                # boutique : catalogue, échanges, bons
    │   ├── arrows.ts                 # Flèches : barème affiché, grades, messages de gain, vérification des publications (+ useMyArrows.ts)
    │   ├── useDealReactions.ts       # réagir en un geste depuis une carte (vote + passage, relecture des votes et masses)
    │   ├── useCurrentUserId.ts       # id de l'utilisateur connecté (session locale)
    │   ├── trust.ts                  # fiabilité pondérée : withTrust() (rpc deal_trust)
    │   ├── hot.ts                    # tri « Hot » de l'onglet « Tout » + badge « Tendance » (réglages : HOT)
    │   ├── matching.ts               # compatibilité bon plan ↔ étudiant (score, raisons)
    │   ├── preferences.ts            # lecture / écriture des préférences
    │   ├── usePreferences.ts         # hook : profil + préférences de l'utilisateur
    │   ├── search.ts                 # recherche de l'accueil : pertinence, fautes de frappe, mots proches (offres déjà chargées)
    │   ├── searchFilters.ts          # filtres, tri et expressions (« pas cher »…) de la recherche
    │   ├── geo.ts                    # distances, zone la plus proche
    │   ├── account.ts                # mot de passe, sessions, export, suppression du compte
    │   ├── community.ts              # étudiants aidés, parrainage, « Y aller », liens partagés, aide, école (022) ; share.ts : partage natif ou copie
    │   ├── places.ts                 # recherche de commerce (Photon / OSM, sans clé) + catégorie proposée d'après le type de lieu
    │   ├── ai/assist.ts              # SERVEUR : appels Gemini ou Claude (extraction photo/texte → formulaire ; plus de relecture IA)
    │   ├── duplicates.ts             # doublons SANS IA à la publication : offres du même lieu (place_name identique) / même catégorie + zone
    │   ├── ai/client.ts              # navigateur : appel de /api/assist (pré-remplissage), compression photo
    │   ├── ai/types.ts               # types partagés AssistDraft / AssistReview
    │   ├── merchant.ts               # espace commerçant : lecture / écriture, isBoosted()
    │   ├── useRole.ts                # hook : étudiant ou commerçant → choisit l'interface
    │   ├── useDashboard.ts           # hook : données de l'espace commerçant
    │   ├── offerStats.ts             # calculs des statistiques d'offres
    │   ├── engagement.ts             # vues, passages, votes ; gestion de ses propres bons plans
    │   ├── useFavorites.ts           # hook : favoris de l'utilisateur (table `favorites`), ajout/retrait optimiste
    │   ├── useDeals.ts               # hook : bons plans visibles (avec votes, masquage appliqué)
    │   ├── location.ts               # accord de localisation (RGPD) et position ponctuelle ; composants dans components/location/
    │   └── useUserPosition.ts        # hook : position GPS suivie avec accord (non enregistrée), réutilisable (tâches 9, 11)
    ├── components/
    │   ├── icons.tsx                 # ~60 icônes maison au trait (sans fond, sans emoji) pour la nav, les boutons, les listes
    │   ├── AuthorBadge.tsx           # badge « Commerçant » (offre officielle) / « Étudiant »
    │   ├── CategoryIcon.tsx          # rond coloré + icône au trait par catégorie (voir DESIGN_SHAREWOOD.md) ; `categoryIconSvg()` = version HTML brute pour les marqueurs Leaflet
    │   ├── NavBar.tsx                # barre du bas : Accueil / Recherche / Partager / Ciblés / Profil (icônes `icons.tsx`)
    │   ├── Tabs.tsx                  # onglets rectangulaires (accueil, Ciblés)
    │   ├── cibles/                   # FavoritesPanel, ActivityPanel (niveau, MyDeals, ArrowHistory)
    │   ├── rewards/                  # RewardsPanel, RedeemDialog, Voucher (QR), Modal
    │   ├── SupabaseBanner.tsx        # bandeau si .env.local absent
    │   ├── LogoutButton.tsx          # déconnexion (page profil)
    │   ├── account/                  # AccountLink, SecuritySection, DataSection, DeleteSection
    │   ├── deal/ReactionBar.tsx      # boutons « J'en ai profité (n) » / « Plus dispo (n) » (carte, fiche, fenêtre de la carte) ; QuickReactions = version autonome
    │   ├── arrows/                   # ArrowBadge (en-têtes), ArrowToast (layout), ArrowsCard (page « Ciblés »)
    │   ├── feed/SearchFilters.tsx    # filtres sous la recherche de Recherche (Sacha ; déplacée depuis l'accueil)
    │   ├── feed/DealCard.tsx         # (tâches 35, 37, 38 : épurée — ligne 1 icône + titre (avec l'avantage) + fiabilité + cœur, ligne 2 pleine largeur lieu · distance, fiabilité, cœur, auteur, conditions, échéance, réactions ; le reste dans la fiche)  carte d'un bon plan dans le fil (bouton cœur favori optionnel : props `favorite` / `onToggleFavorite`, icône `HeartIcon` ; prop optionnel `onSelect(dealId)` : si l'offre a un lieu, toucher la carte la sélectionne sur `DealsMap` au lieu d'ouvrir sa fiche — utilisé par Recherche seulement ; prop `selected` : contour aubergine, même couleur que le repère choisi sur la carte). Offre sponsorisée : cadre doré **et** étiquette « Sponsorisé » (icône `SparklesIcon`), indépendante du surlignage de sélection.
    │   ├── deal/DealSheet.tsx        # fiche d'un bon plan : fiabilité, votes, « J'en ai profité » (ouverte depuis le fil et la carte)
    │   ├── deal/DealExtras.tsx       # LinkedText (URL cliquables), RequirementBadges (conditions), OfferLink (« Voir l'offre »)
    │   ├── profile/                  # ActivityCard (niveau sur une ligne) et MyDealCard (ligne dépliable), affichés dans « Ciblés » ; profil : ProfileHeader, ImpactCard, ReferralCard, SettingsMenu (groupes, sections dépliables), PersonalInfo, NotificationsPanel (bientôt), HelpPanel, PreferencesSummary
    │   ├── RoleGate.tsx              # (layout) commerçant → /commercant, jamais l'interface étudiante
    │   ├── merchant/                 # MerchantPage, BusinessForm, LocationPicker, OfferForm, OfferCard, OfferChart
    │   ├── preferences/              # PreferencesWizard (parcours en 7 étapes) + ChoiceTile
    │   └── map/                      # DealsMap.tsx (<DealsMap deals={...} selectedId?/>, centre et met en avant — `.wz-pin-selected` — l'offre choisie dans une liste de Recherche), BaseMap.tsx (fond + palette), DealsMapLoader.tsx (à importer) ; styles `.wz-*` dans globals.css
    └── app/
        ├── layout.tsx                # layout global (fr, NavBar)
        ├── page.tsx                  # / accueil : onglets « Pour toi » et 4 rubriques seulement (Sacha)
        ├── recherche/page.tsx        # carte (Justin) + barre de recherche et filtres (Sacha, déplacés depuis l'accueil) + tri Hot (Matteo) ; pas de filtre par catégorie (retiré, tâche demandée par Anne-Lise)
        ├── login/page.tsx            # connexion / inscription (fait)
        ├── onboarding/page.tsx       # préférences : après inscription et modification (Sacha)
        ├── api/assist/route.ts       # POST { action: "extract" } : pré-remplissage IA (connexion requise ; 503 « unavailable » sans clé)
        ├── publier/page.tsx          # signaler un bon plan (Matteo) → components/publish/PublishForm.tsx (lieu, titre, catégorie ; le reste sous « Plus de détails ») + AssistPanel.tsx (photo analysée dès qu'elle est choisie)
        ├── favoris/page.tsx          # « Ciblés » : carte Flèches + grade, onglets Favoris / Activité / Récompenses (`?onglet=`)
        ├── compte/page.tsx           # compte et confidentialité, étudiants et commerçants (Sacha)
        ├── confidentialite/page.tsx  # politique de confidentialité, lisible sans compte (Sacha)
        ├── commercant/               # (Justin) page = mes offres · statistiques/ · compte/
        └── profil/page.tsx           # en-tête, étudiants aidés, parrainage, menu des réglages (une section ouverte à la fois) ; simuler position à faire (Matteo)
        # + offre/page.tsx : offre ouverte par un lien partagé (`?id=&de=<code>`) ; sans compte, `proxy.ts` renvoie à la connexion puis revient (`?suite=`) ; `/login?parrain=CODE` pré-remplit l'inscription
```

## Conventions de code
- **Écrans** : téléphone par défaut ; ordinateur à partir de `lg:` (1024 px). `NavBar` passe en haut (hauteur 4 rem, marges de `main` dans `globals.css`, classes `.sw-nav` / `.sw-main`) et les en-têtes de page (logo + Flèches) sont masqués (`lg:hidden`). Recherche : liste à gauche (défile), carte à droite sur `100dvh - 4rem`. Accueil et Favoris en grille ; Partager, Profil, Compte, préférences en colonne `lg:max-w-2xl` ; fiches centrées.
- `.gitignore` : les règles héritées du modèle Python sont ancrées à la racine (`/lib/`, `/build/`…). Après ajout d'un dossier, vérifier avec `git status` qu'il est bien suivi.
- **Pages interactives = composants client** (`"use client"`) qui lisent et écrivent dans Supabase via `getSupabase()`. La sécurité est assurée par les **policies RLS**, pas par le front.
- Ne pas appeler `cookies()` dans un Server Component (avec `cacheComponents`, ça casse le build sans `<Suspense>`). L'auth côté serveur est gérée par `src/proxy.ts`.
- Leaflet : composant carte en `"use client"`, chargé via `next/dynamic(..., { ssr: false })`. Le CSS Leaflet est déjà importé dans `globals.css`.
- Polices **Newsreader** (titres, `h1/h2/h3` + `.sw-quote`) et **Inter** (reste) : fichiers `.woff2` auto-hébergés dans `public/fonts/` + `@font-face` dans `globals.css` (pas `next/font/google` ni police système : build sans dépendance réseau sur n'importe quel poste).
- Design : jetons CSS dans `globals.css` (`@theme inline` : `--color-paper/surface/border/ink/muted/forest/aubergine/aubergine-dark/sage/lilac`, `--font-sans/serif`) + classes réutilisables `.sw-card`, `.sw-btn-primary`, `.sw-btn-secondary`, `.sw-field`, `.sw-badge`, `.sw-eyebrow`, `.sw-quote`. Détail complet et logo dans `DESIGN_SHAREWOOD.md` (racine du repo).
- Récupérer l'utilisateur côté client : `const { data: { user } } = await getSupabase().auth.getUser()`.

## Contraintes techniques
- Notif « sur place » : impossible de suivre la position en arrière-plan sur le web → démo avec une **position simulée** (ou `navigator.geolocation` quand l'app est ouverte).
- Géolocalisation : uniquement en HTTPS ou sur `localhost` (pas via l'IP du réseau local). Utiliser `useUserPosition()` (suivi) ou `currentPosition()` de `lib/location.ts` (ponctuel) : les deux exigent l'accord. Accord gardé dans `user_metadata.location_consent` (choix, date, version `CONSENT_VERSION` : la changer si les usages changent) ; sans migration. `LocationConsentDialog` est dans le layout ; `LocationNotice` = mention « position sécurisée ».

## Base de données (`supabase/schema.sql`)
- **Modifier la BDD** : créer `supabase/migrations/NNN_description.sql` (numéro suivant) ET reporter le changement dans `schema.sql`, puis demander à l'utilisateur de lancer la migration dans le SQL Editor (Claude ne peut pas : seule la clé publique est disponible). Noter dans TASKS / JOURNAL quelles migrations sont appliquées.
- ⚠️ Toute nouvelle table ou vue doit avoir son `GRANT ... to authenticated` (pas de droits par défaut sur ce projet), en plus de ses policies RLS.
- Migrations appliquées : `schema.sql`, `002` à `009` ✅ (004 à 009 détectées via l'API le 27/11) · `010_student_aids.sql` ✅ · `011_no_self_vote.sql` ✅ · `012_requirements_links.sql` ✅ (détectée par Justin) · `013_unvote.sql` ⏳ · `014_voter_weights.sql` ⏳ · `015_demo_titles.sql` ⏳ · `016_arrows.sql` ⏳ · `017_rewards.sql` ⏳ · `018_no_access_limit.sql` ⏳ · `019_golden_badge_text.sql` ⏳ · `020_location_rules.sql` ⏳ · `021_gone_on_site.sql` ✅ (Justin) · `022_profile_impact_referral.sql` ✅ (détectée par Justin) · `023_doubtful_deals.sql` ⏳ **à exécuter** · le 27/11 au soir, 017 et 018 détectées sur la vraie base (sonde en lecture)
- `supabase/reset_demo.sql` (après 012) : ⚠️ efface les comptes non listés puis crée 20 étudiants (`demo.<prénom>@example.com`), 12 commerçants **fictifs** (`demo.commerce1..12@example.com`) et ~150 bons plans à 15 km de Bruz (14 sourcés, le reste inventé sur des lieux OpenStreetMap, ODbL : titre normal, description « Exemple fictif (démo) … »). Une adresse à garder sans compte est ignorée et listée (⚠️ faute de frappe = vrai compte effacé). Comptes gardés et mot de passe à remplir à la main (jamais sur git ; copie locale `*.local.sql`).
- `supabase/seed_demo.sql` : ancien jeu d'exemples fictifs.
- **Récompenses (017)** : `rewards` (catalogue de 6, inséré par la migration ; partenaires fictifs « (démo) ») et `user_rewards` (prix payé, code `SW-XXXXXX`, `used_at`), en lecture seule pour l'app. RPC `redeem_reward(id)` (verrou par étudiant, vérifie le solde, dépense et active l'avantage) et `use_reward(id)` (bon commerçant, une fois). **Double compteur** calculé, non stocké : `total_arrows_earned` (gains → rang) et `current_arrows_balance` (gains − dépenses), renvoyés par `my_arrows()`. `profiles.golden_badge` et `early_access_until` non écrivables.
- `supabase/seed_arrows.sql` (après 016, 017, 020, 022, 023 et `reset_demo.sql`, relançable ; ajoute aussi le profil de sarah : 3 filleuls et 42 comptes `demo.publicNN` sans mot de passe) : historique inventé donnant des rangs différents à six comptes de démo + trois offres scénarisées (3e confirmation, 3e signalement, déjà archivée) ; démo conseillée en `demo.sarah`.
- **Les Flèches (016)** : `arrow_events` (journal : create 50, bonus 30, confirm 10, report 15 ; `paid` false = signalement en attente) et `activity_days` (série), lisibles par leur seul propriétaire, **écrits uniquement par des triggers** sur `deals` et `votes`. `deals.archived_at` (non écrivable) posé au 3e « Plus dispo ». RPC `react_to_deal(deal, value, lat?, lng?)` (invoker : droits de `votes` ; position non enregistrée) et `my_arrows()`. Un vote retiré ou une offre supprimée retire les gains correspondants (les votants d'une offre supprimée gardent les leurs). Barème en double dans `src/lib/arrows.ts`. **Depuis 020** : barème selon le lieu (voir `docs/ALGORITHMES.md` § 6) ; une offre placée reçoit une ligne de publication à 0, relevée par `claim_creation_arrows(deal, lat?, lng?)` (auteur, 15 min, ≤ 500 m, position non enregistrée). **021** : trigger `votes_presence` (avant écriture) qui refuse un vote -1 de l'app sur une offre placée sans position à 500 m ; les scripts SQL Editor ne sont pas contrôlés.
- **Retrait (023)** : `deals.doubtful_since` et `reports_reset_at` (non écrivables) ; `arrow_refresh_deal` applique les règles à chaque changement de vote, `settle_doubtful_deals()` (appelée par `useDeals`) retire les offres échues. Un retrait (`archived_at`) est définitif.
- **Profil (022)** : `preferences.school` ; `deal_directions` (« Y aller », une ligne par étudiant et offre) ; `deal_shares` (lien ouvert, écrit par `record_share_open`) ; `referral_codes`, `referrals` (écrites par la base : code via `ensure_referral_code`, parrain retenu à l'inscription par `handle_new_user`, versement par un trigger sur `activity_days`) ; `support_messages` (10 par jour). RPC `my_impact`, `my_referrals`, `check_referral_code` (ouverte sans compte). `arrow_events.kind` accepte `referral` et `welcome`.
- **Colonnes verrouillées (003)** : l'app ne peut pas écrire `profiles.role` ni `profiles.last_contribution_at` (plus relevée depuis 018), ni `deals.created_at`, ni modifier `is_official` / `author_id` après publication. Toute nouvelle colonne de `profiles` ou `deals` doit être ajoutée aux GRANT. Devenir commerçant : choix « Commerçant » à l'inscription puis fiche du commerce (`register_business`).
- **Confidentialité (009)** : chacun ne lit que son profil ; `profiles.privacy_accepted_at` posée à l'inscription ; pseudo ≤ 40 ; `deals.author_id` nullable (`on delete set null`) ; RPC `my_kept_deals()` et `delete_my_account()` (garde les bons plans actifs avec plus de 👍 que de 👎 d'autres étudiants, hors offres officielles)
- `businesses` (un par compte commerçant, écriture via `register_business` seulement) : owner_id, name, address, category (restaurant | supermarket | activity | sport), zone_id, lat, lng
- `deals.boosted_until` (mise en avant, via `boost_offer`) et `deals.ended_by` (via `set_nearby_deal_ended`) : non écrivables directement
- Fonctions commerçant : `my_offer_stats()`, `deals_near_my_business()` (≤ 75 m, même catégorie, bons plans d'étudiants)
- `preferences` (**privée**, RLS : propriétaire seul) : user_id, home_zone_id, lat, lng (facultatifs, arrondis), transport_modes[], budget_profile (tight | balanced | comfort), activities[], home_visits (often | sometimes | never), wants_travel, travel_modes[] (ids de sous-catégories transport), updated_at
- `preferences.is_scholarship`, `has_carte_sortir` (010, booléens facultatifs) ; `wants_travel` n'est plus demandé
- `deals.price_level` (0 gratuit … 3) et `deals.tags[]` (ids d'activités)
- `deals.requirements text[]` (012) : conditions parmi `student_card | carte_sortir | scholarship | under_26` (contrainte SQL) ; `deals.link_url` (012) : lien http(s) ≤ 500 caractères (contrainte SQL). **`carte_sortir` n'est plus une catégorie** : valeur gardée dans le type `deal_category` des bases existantes mais interdite par `deals_no_carte_sortir_category` ; retirée du type dans `schema.sql`
- `deals.photo_url` (008) : photo de preuve, uniquement un lien vers le stockage public **`deal-photos`** (contrainte SQL) ; dépôt par l'auteur dans `<son id>/…` (policies `storage.objects`) via `src/lib/photos.ts` ; affichée dans le fil (`DealCard`)
- `profiles.followed_categories` est **ordonné** : les 3 premières sont les priorités
- `zones` : id (`bruz`, `ker-lann`, `rennes`), name, center_lat, center_lng, radius_m — coordonnées vérifiées (OpenStreetMap)
- `profiles` : id (= auth.users), username, role (student | merchant), followed_categories[], followed_zone_ids[], last_contribution_at (inutilisée depuis 018), onboarded — **créé automatiquement à l'inscription** (trigger)
- `deals` : id, title, description, category, subcategory (transport uniquement), scope (local | zone | national ; local ⇒ lat/lng obligatoires), zone_id, place_name, lat, lng, price_info, expires_at, deadline_at, is_official (commerçants uniquement), ended_by_merchant, author_id (= auth.uid() par défaut), created_at
- `votes` : deal_id, user_id, value (+1 / -1), created_at — jamais sur son propre bon plan (RLS, 011) ; **un vote par utilisateur et par bon plan** : re-confirmer = `upsert` (created_at remis à now()) ; retirer son vote = `delete` (013). Dans la fiche : +1 = « J'en ai profité » (avec un passage `deal_visits`), −1 = « Plus dispo » ; plus de bouton « Toujours dispo »
- `favorites` : (user_id, deal_id)
- `deal_views` / `deal_visits` : (deal_id, user_id) — fiche ouverte / « J'en ai profité », auteur exclu, lecture limitée à ses propres lignes ; totaux via `deal_visit_count()` et `my_deal_audience()`
- Vue `user_contributions` : contributions (bons plans + votes) par utilisateur et catégorie, `count_7d` / `count_30d`
- Fonctions RPC : `is_merchant()` (`has_full_access()` et `active_users_in_zone` supprimées par 018)
- Lecture des offres : ouverte à tous les comptes connectés (018) ; un re-vote rafraîchit `votes.created_at` (trigger).

## Règles métier (`src/lib/rules.ts` + RLS)
- **Fiabilité façon Waze (tâche 33)** : masse d'une réaction = poids de l'étudiant × 0,5^(âge / 48 h), un « Plus dispo » postérieur à la dernière confirmation × 1,5. Score = (masse des « J'en ai profité » + 0,5) / (masse totale + 1) : sans réaction récente il redescend vers 0,5 (« À vérifier »). Affiché en couleur (`TRUST_LEVELS`, `TrustBadge`) : vert foncé ≥ 0,85 · vert clair ≥ 0,65 · jaune ≥ 0,4 · rouge · « Nouveau » sans réaction. La fiabilité ne masque plus rien : une offre est **masquée** si 3 étudiants la signalent « Plus dispo » (archivée, `ARCHIVE_REPORTS`), si elle est retirée ou expirée.
- **Retrait des offres (tâche 69)** : « Douteux » au 3e « Plus dispo » ; sauvée par 3 « J'en ai profité » postérieurs ; sinon retirée à 14 jours ; 6 signalements en 48 h sans confirmation entre-temps : retrait immédiat. Flèches des signalements versées au retrait. Constantes dans `rules.ts` et la migration 023.
- **Flèches** : voir « Base de données » ; rangs (`RANKS`) : Éclaireur < 150 ≤ Chasseur de bons plans < 500 ≤ Robin des Étudiants. Gains × 1,5 dès 3 jours d'activité d'affilée (heure de Paris), 5 votes payés par jour, offre placée : Flèches seulement à 500 m au plus avec la position ; sans lieu : montants réduits (020).
- **Poids d'un étudiant** (`voter_stats()`, SQL, jamais exposé un par un ; 0,5 à 2) = (0,4 + 0,9 × justesse lissée (a+2)/(n+3)) × (1 + 0,5 × activité 30 j) × 0,6 si compte < 3 jours. `deal_trust(ids)` renvoie les masses par offre  (le poids n'est affiché nulle part depuis la tâche 44 ; la RPC `my_influence()` n'est plus appelée). Sans 014 : poids 1 pour tous.
- **Aucun accès limité** selon l'activité (018). Seules les **publications récompensées** sont plafonnées : 3 par jour (au-delà, ligne à 0 Flèche dans `arrow_events`, sans bonus).
- **Niveaux** (sur 7 jours) : ≥10 Très actif · ≥3 Actif · ≥1 Peu actif · 0 Inactif (icône dédiée par niveau dans `rules.ts`, pas d'emoji).

## Personnalisation (`src/lib/matching.ts`)
- Score sur 100 = points obtenus / points applicables (un critère non renseigné ne compte pas) : pôle de dépenses 40 (−4 par rang), localisation 25 (distance selon les transports, ou zone suivie), budget 20, activité ou transport emprunté 15.
- **Voyages** : un transport longue distance (hors bus local) compte comme un pôle suivi selon la fréquence de voyage (souvent 36, parfois 28, rarement 16 et seulement dans un mode choisi).
- **Aides** : `scholarship` n'est plus une priorité ; une bourse est dans « Pour toi » seulement si l'étudiant a répondu oui à « Boursier » (et si l'offre est à portée).
- **Conditions** (`deals.requirements`) : `carte_sortir` / `scholarship` → répondu non à la question correspondante = jamais « Pour toi » ; oui = « Pour toi » si à portée, avec la raison « Avec ta Carte Sortir » / « Tu es boursier » ; pas répondu = score normal. `student_card` / `under_26` : simple badge.
- Cartes : badge de **fiabilité** (`trustPercent`, « Nouveau » sans vote) ; la compatibilité ne sert qu'au tri et aux raisons.
- **Budget** : change le score et l'ordre, mais ne retire jamais un bon plan.
- **« Pour toi »** : score hors budget ≥ 55, à portée, et catégorie suivie, activité / transport aimé ou trajet utile. Chaque carte affiche les raisons (« Ta priorité n°1 », « ≈ 8 min à vélo »…).
- Distances à vol d'oiseau depuis la position enregistrée, sinon le centre de la zone principale ; durées estimées.
- ⚠️ Next conserve les pages quittées (`<Activity>`) : les effets sont relancés au retour ; tout composant qui manipule le DOM (Leaflet) doit le supporter.

## Accueil (`src/app/page.tsx`)
- **Filtres (tâche 67, remplace les onglets de la tâche 56)** : rangée de puces défilante (centrée et sur plusieurs lignes sur ordinateur). Filtre principal exclusif : « Pour toi » (par défaut ; offres compatibles, sinon les plus récentes) ou « Mes favoris » (échéance la plus proche d'abord) ; retoucher la puce active la désactive → toutes les offres. Puis une puce par catégorie (`CATEGORIES`), **cumulables** (aucune = toutes). Les offres sur la carte et sans lieu sont incluses. `Tabs.tsx` reste utilisé par « Ciblés ».

## Recherche (`src/app/recherche/page.tsx`)
- Carte (Justin) toujours affichée avec **toutes** les offres localisées (plus de filtre par catégorie, retiré pour laisser la place à la recherche). Sous la carte : le fil « Hot » par défaut, remplacé par les résultats de recherche dès qu'on tape.
- **Recherche** (`src/lib/search.ts`, locale : la saisie n'est envoyée nulle part ; déplacée depuis l'accueil) : formulaire avec bouton « Rechercher » (touche du clavier mobile grâce à `action` + `enterKeyHint` ; valider ferme le clavier) et croix « Annuler la recherche » (vide le champ, retour au fil « Hot ») ; une saisie remplace le fil par une liste de toutes les offres chargées. Tous les mots sont exigés (petits mots ignorés), sans accents ni casse, pluriels compris. Poids : titre 10, lieu 6, catégorie / activités / conditions 4, description 3, prix et zone 2 ; sponsorisées en tête de chaque groupe. « Résultats proches » (après les exacts) : mots proches (`RELATED`) ou faute de frappe (seulement si le mot n'existe dans aucune offre). Abréviations équivalentes dans `SAME`.
- **Filtres des résultats** (`lib/searchFilters.ts`, `components/feed/SearchFilters.tsx`) : prix (`price_level` ≤ 0 / 1 / 2), moyen (à pied, vélo, bus, voiture) + 10 / 20 / 30 min estimées à vol d'oiseau depuis la position enregistrée ou la zone principale (`travelMinutes`, `matching.ts`), condition, tri (pertinence / proximité / prix). Un filtre actif écarte les offres sans l'information. « gratuit », « pas cher », « près de moi » (et variantes) sont retirés des mots cherchés et activent le filtre ; un choix manuel l'emporte, une nouvelle expression reprend la main ; champ vidé → filtres remis à zéro.
- **Sélection sur la carte** : dans une liste (recherche ou fil « Hot »), toucher une offre **avec un lieu** la sélectionne (`DealsMap selectedId`) au lieu d'ouvrir sa fiche — la carte s'y centre et la met en avant (`.wz-pin-selected`), **et la carte de la liste se surligne aussi** (même contour aubergine, prop `selected` de `DealCard`), pour comparer vite plusieurs offres par leur distance. Une offre **sans lieu** (zone / nationale) garde l'ouverture de sa fiche (repli dans `DealCard`, rien à montrer sur la carte).

## Tri « Hot » (`src/lib/hot.ts`, liste de Recherche)
- Hot = (1 + élan + quantité) / (âge en heures + 2)^1,2 · élan = Σ réactions pondérées par leur fraîcheur (demi-vie 24 h ; « J'en ai profité » +1, « Plus dispo » −1,5) · quantité = log2(1 + nb de « J'en ai profité »). Calculé avec les votes déjà chargés (`useDeals`, instant `loadedAt`).
- Sponsorisés toujours en tête (aucun autre bonus). L'accueil n'est pas concerné : ses onglets sont triés par compatibilité (par date sans profil), sponsorisés en tête.
- Plus de badge « Tendance » (retiré, tâche 37).
