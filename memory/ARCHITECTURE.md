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

## Déploiement (Vercel)
Import du repo sur vercel.com (par sachabj, propriétaire) avec les variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `GEMINI_API_KEY` ou `ANTHROPIC_API_KEY` (serveur uniquement, ⏳ **à ajouter** pour activer l'IA) → chaque push sur `main` redéploie. URL publique : **https://hackathon18-t1lb.vercel.app** ✅. Après un changement de variable d'environnement : redéployer.

## Arborescence
```
/
├── CLAUDE.md, AGENTS.md, README.md   # protocole Claude, règles Next 16 (générées par next), présentation
├── memory/                           # mémoire partagée du projet
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
    │   ├── rules.ts                  # règles métier : fiabilité, accès 7 j, niveaux
    │   ├── matching.ts               # compatibilité bon plan ↔ étudiant (score, raisons)
    │   ├── preferences.ts            # lecture / écriture des préférences
    │   ├── usePreferences.ts         # hook : profil + préférences de l'utilisateur
    │   ├── geo.ts                    # distances, zone la plus proche
    │   ├── account.ts                # mot de passe, sessions, export, suppression du compte
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
    │   └── useUserPosition.ts        # hook : position GPS suivie (non enregistrée), réutilisable (tâches 9, 11)
    ├── components/
    │   ├── icons.tsx                 # ~60 icônes maison au trait (sans fond, sans emoji) pour la nav, les boutons, les listes
    │   ├── AuthorBadge.tsx           # badge « Commerçant » (offre officielle) / « Étudiant »
    │   ├── CategoryIcon.tsx          # rond coloré + icône au trait par catégorie (voir DESIGN_SHAREWOOD.md) ; `categoryIconSvg()` = version HTML brute pour les marqueurs Leaflet
    │   ├── NavBar.tsx                # barre du bas : Accueil / Recherche / Partager / Favoris / Profil (icônes `icons.tsx`)
    │   ├── SupabaseBanner.tsx        # bandeau si .env.local absent
    │   ├── LogoutButton.tsx          # déconnexion (page profil)
    │   ├── account/                  # AccountLink, SecuritySection, DataSection, DeleteSection
    │   ├── feed/DealCard.tsx         # carte d'un bon plan dans le fil (bouton cœur favori optionnel : props `favorite` / `onToggleFavorite`, icône `HeartIcon`)
    │   ├── deal/DealSheet.tsx        # fiche d'un bon plan : fiabilité, votes, « J'y suis allé » (ouverte depuis le fil et la carte)
    │   ├── deal/DealExtras.tsx       # LinkedText (URL cliquables), RequirementBadges (conditions), OfferLink (« Voir l'offre »)
    │   ├── profile/                  # ActivityCard, PreferencesSummary, MyDealCard
    │   ├── RoleGate.tsx              # (layout) commerçant → /commercant, jamais l'interface étudiante
    │   ├── merchant/                 # MerchantPage, BusinessForm, LocationPicker, OfferForm, OfferCard, OfferChart
    │   ├── preferences/              # PreferencesWizard (parcours en 7 étapes) + ChoiceTile
    │   └── map/                      # DealsMap.tsx (<DealsMap deals={...}/>), BaseMap.tsx (fond + palette), DealsMapLoader.tsx (à importer) ; styles `.wz-*` dans globals.css
    └── app/
        ├── layout.tsx                # layout global (fr, NavBar)
        ├── page.tsx                  # / accueil : 3 « Pour toi » + « Réductions & aides » (offres sans lieu)
        ├── recherche/page.tsx        # carte (Justin) + fil « Pour toi » / « Tout » et filtres (Sacha)
        ├── login/page.tsx            # connexion / inscription (fait)
        ├── onboarding/page.tsx       # préférences : après inscription et modification (Sacha)
        ├── api/assist/route.ts       # POST { action: "extract" } : pré-remplissage IA (connexion requise ; 503 « unavailable » sans clé)
        ├── publier/page.tsx          # signaler un bon plan (Matteo) → components/publish/PublishForm.tsx
        ├── favoris/page.tsx          # favoris (Anne-Lise)
        ├── compte/page.tsx           # compte et confidentialité, étudiants et commerçants (Sacha)
        ├── confidentialite/page.tsx  # politique de confidentialité, lisible sans compte (Sacha)
        ├── commercant/               # (Justin) page = mes offres · statistiques/ · compte/
        └── profil/page.tsx           # accès, niveau, préférences, mes bons plans (Justin) ; simuler position à faire (Matteo)
```

## Conventions de code
- `.gitignore` : les règles héritées du modèle Python sont ancrées à la racine (`/lib/`, `/build/`…). Après ajout d'un dossier, vérifier avec `git status` qu'il est bien suivi.
- **Pages interactives = composants client** (`"use client"`) qui lisent et écrivent dans Supabase via `getSupabase()`. La sécurité est assurée par les **policies RLS**, pas par le front.
- Ne pas appeler `cookies()` dans un Server Component (avec `cacheComponents`, ça casse le build sans `<Suspense>`). L'auth côté serveur est gérée par `src/proxy.ts`.
- Leaflet : composant carte en `"use client"`, chargé via `next/dynamic(..., { ssr: false })`. Le CSS Leaflet est déjà importé dans `globals.css`.
- Polices **Newsreader** (titres, `h1/h2/h3` + `.sw-quote`) et **Inter** (reste) : fichiers `.woff2` auto-hébergés dans `public/fonts/` + `@font-face` dans `globals.css` (pas `next/font/google` ni police système : build sans dépendance réseau sur n'importe quel poste).
- Design : jetons CSS dans `globals.css` (`@theme inline` : `--color-paper/surface/border/ink/muted/forest/aubergine/aubergine-dark/sage/lilac`, `--font-sans/serif`) + classes réutilisables `.sw-card`, `.sw-btn-primary`, `.sw-btn-secondary`, `.sw-field`, `.sw-badge`, `.sw-eyebrow`, `.sw-quote`. Détail complet et logo dans `DESIGN_SHAREWOOD.md` (racine du repo).
- Récupérer l'utilisateur côté client : `const { data: { user } } = await getSupabase().auth.getUser()`.

## Contraintes techniques
- Notif « sur place » : impossible de suivre la position en arrière-plan sur le web → démo avec une **position simulée** (ou `navigator.geolocation` quand l'app est ouverte).
- Géolocalisation : uniquement en HTTPS ou sur `localhost` (pas via l'IP du réseau local). Utiliser `useUserPosition()`.

## Base de données (`supabase/schema.sql`)
- **Modifier la BDD** : créer `supabase/migrations/NNN_description.sql` (numéro suivant) ET reporter le changement dans `schema.sql`, puis demander à l'utilisateur de lancer la migration dans le SQL Editor (Claude ne peut pas : seule la clé publique est disponible). Noter dans TASKS / JOURNAL quelles migrations sont appliquées.
- ⚠️ Toute nouvelle table ou vue doit avoir son `GRANT ... to authenticated` (pas de droits par défaut sur ce projet), en plus de ses policies RLS.
- Migrations appliquées : `schema.sql`, `002` à `009` ✅ (004 à 009 détectées via l'API le 27/11) · `010_student_aids.sql` ✅ · `011_no_self_vote.sql` ✅ · `012_requirements_links.sql` ✅ (détectée par Justin) · `013_unvote.sql` ⏳ **à exécuter**
- `supabase/reset_demo.sql` (après 012) : ⚠️ efface les comptes non listés puis crée 20 étudiants (`demo.<prénom>@example.com`), 12 commerçants **fictifs** (`demo.commerce1..12@example.com`) et ~150 bons plans à 15 km de Bruz (14 sourcés, le reste « [Exemple] » sur des lieux OpenStreetMap, ODbL). Une adresse à garder sans compte est ignorée et listée (⚠️ faute de frappe = vrai compte effacé). Comptes gardés et mot de passe à remplir à la main (jamais sur git ; copie locale `*.local.sql`).
- `supabase/seed_demo.sql` : ancien jeu d'exemples fictifs.
- **Colonnes verrouillées (003)** : l'app ne peut pas écrire `profiles.role` ni `profiles.last_contribution_at`, ni `deals.created_at`, ni modifier `is_official` / `author_id` après publication. Toute nouvelle colonne de `profiles` ou `deals` doit être ajoutée aux GRANT. Devenir commerçant : choix « Commerçant » à l'inscription puis fiche du commerce (`register_business`).
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
- `profiles` : id (= auth.users), username, role (student | merchant), followed_categories[], followed_zone_ids[], last_contribution_at, onboarded — **créé automatiquement à l'inscription** (trigger)
- `deals` : id, title, description, category, subcategory (transport uniquement), scope (local | zone | national ; local ⇒ lat/lng obligatoires), zone_id, place_name, lat, lng, price_info, expires_at, deadline_at, is_official (commerçants uniquement), ended_by_merchant, author_id (= auth.uid() par défaut), created_at
- `votes` : deal_id, user_id, value (+1 / -1), created_at — jamais sur son propre bon plan (RLS, 011) ; **un vote par utilisateur et par bon plan** : re-confirmer = `upsert` (created_at remis à now()) ; retirer son vote = `delete` (013). Dans la fiche : +1 = « J'y suis allé » (avec un passage `deal_visits`), −1 = « Plus dispo » ; plus de bouton « Toujours dispo »
- `favorites` : (user_id, deal_id)
- `deal_views` / `deal_visits` : (deal_id, user_id) — fiche ouverte / « J'y suis allé », auteur exclu, lecture limitée à ses propres lignes ; totaux via `deal_visit_count()` et `my_deal_audience()`
- Vue `user_contributions` : contributions (bons plans + votes) par utilisateur et catégorie, `count_7d` / `count_30d`
- Fonctions RPC : `has_full_access()`, `is_merchant()`, `active_users_in_zone(z)`
- Triggers : publier ou voter → `profiles.last_contribution_at = now()`

## Règles métier (`src/lib/rules.ts` + RLS)
- **Fiabilité** : moyenne des votes pondérée par l'ancienneté (demi-vie 48 h). Masqué si score < 0,3 ET nb de votes ≥ `minVotesToHide` = 5 % des utilisateurs actifs de la zone, borné entre 2 et 10. Masqué aussi si `ended_by_merchant` ou expiré.
- **Accès complet** si dernière contribution < 7 jours. Sinon, **la RLS cache les bons plans de moins de 24 h** (sauf les siens). ✅ 7 jours offerts à l'inscription.
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
