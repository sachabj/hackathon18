# ARCHITECTURE

## Stack ✅
- **Next.js 16.4** (App Router, TypeScript, `src/`) + **Tailwind 4**, web app responsive
- **Supabase** (Postgres + auth + RLS) via `@supabase/supabase-js` + `@supabase/ssr`
- **Leaflet** + `react-leaflet` 5 ; fond de carte vectoriel **OpenFreeMap** (sans clé) via `maplibre-gl` 6 + `@maplibre/maplibre-gl-leaflet` (secours : tuiles OpenStreetMap)
- **Vercel** pour le déploiement
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
Import du repo sur vercel.com (par sachabj, propriétaire) avec les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` → chaque push sur `main` redéploie. URL publique : **https://hackathon18-t1lb.vercel.app** ✅. Après un changement de variable d'environnement : redéployer.

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
    │   ├── constants.ts              # CATEGORIES, SUBCATEGORIES, ZONES, MAP_CENTER
    │   ├── rules.ts                  # règles métier : fiabilité, accès 7 j, niveaux
    │   ├── matching.ts               # compatibilité bon plan ↔ étudiant (score, raisons)
    │   ├── preferences.ts            # lecture / écriture des préférences
    │   ├── usePreferences.ts         # hook : profil + préférences de l'utilisateur
    │   ├── geo.ts                    # distances, zone la plus proche
    │   ├── useDeals.ts               # hook : bons plans visibles (avec votes, masquage appliqué)
    │   └── useUserPosition.ts        # hook : position GPS suivie (non enregistrée), réutilisable (tâches 9, 11)
    ├── components/
    │   ├── NavBar.tsx                # barre du bas : Carte / Signaler / Favoris / Profil
    │   ├── SupabaseBanner.tsx        # bandeau si .env.local absent
    │   ├── feed/DealCard.tsx         # carte d'un bon plan dans le fil
    │   ├── preferences/              # PreferencesWizard (parcours en 6 étapes) + ChoiceTile
    │   └── map/                      # DealsMap.tsx (<DealsMap deals={...}/>), BaseMap.tsx (fond + palette), DealsMapLoader.tsx (à importer) ; styles `.wz-*` dans globals.css
    └── app/
        ├── layout.tsx                # layout global (fr, NavBar)
        ├── page.tsx                  # / carte (Justin) + fil « Pour toi » et filtres (Sacha)
        ├── login/page.tsx            # connexion / inscription (fait)
        ├── onboarding/page.tsx       # préférences : après inscription et modification (Sacha)
        ├── publier/page.tsx          # signaler un bon plan (Anne-Lise)
        ├── favoris/page.tsx          # favoris (Anne-Lise)
        └── profil/page.tsx           # niveau, accès, simuler position (Matteo)
```

## Conventions de code
- `.gitignore` : les règles héritées du modèle Python sont ancrées à la racine (`/lib/`, `/build/`…). Après ajout d'un dossier, vérifier avec `git status` qu'il est bien suivi.
- **Pages interactives = composants client** (`"use client"`) qui lisent et écrivent dans Supabase via `getSupabase()`. La sécurité est assurée par les **policies RLS**, pas par le front.
- Ne pas appeler `cookies()` dans un Server Component (avec `cacheComponents`, ça casse le build sans `<Suspense>`). L'auth côté serveur est gérée par `src/proxy.ts`.
- Leaflet : composant carte en `"use client"`, chargé via `next/dynamic(..., { ssr: false })`. Le CSS Leaflet est déjà importé dans `globals.css`.
- Police système (pas de `next/font/google` : le build échoue sans réseau).
- Récupérer l'utilisateur côté client : `const { data: { user } } = await getSupabase().auth.getUser()`.

## Contraintes techniques
- Notif « sur place » : impossible de suivre la position en arrière-plan sur le web → démo avec une **position simulée** (ou `navigator.geolocation` quand l'app est ouverte).
- Géolocalisation : uniquement en HTTPS ou sur `localhost` (pas via l'IP du réseau local). Utiliser `useUserPosition()`.

## Base de données (`supabase/schema.sql`)
- **Modifier la BDD** : créer `supabase/migrations/NNN_description.sql` (numéro suivant) ET reporter le changement dans `schema.sql`, puis demander à l'utilisateur de lancer la migration dans le SQL Editor (Claude ne peut pas : seule la clé publique est disponible). Noter dans TASKS / JOURNAL quelles migrations sont appliquées.
- ⚠️ Toute nouvelle table ou vue doit avoir son `GRANT ... to authenticated` (pas de droits par défaut sur ce projet), en plus de ses policies RLS.
- Migrations appliquées : `schema.sql` ✅ · `002_grants.sql` ✅ · `003_column_grants.sql` ✅ · `004_preferences.sql` ⏳ **à exécuter**
- `supabase/seed_demo.sql` : bons plans d'exemple fictifs (facultatif, après 004).
- **Colonnes verrouillées (003)** : l'app ne peut pas écrire `profiles.role` ni `profiles.last_contribution_at`, ni `deals.created_at`, ni modifier `is_official` / `author_id` après publication. Toute nouvelle colonne de `profiles` ou `deals` doit être ajoutée aux GRANT. Pour créer un compte commerçant : Table Editor → profiles → `role = merchant`.
- `preferences` (**privée**, RLS : propriétaire seul) : user_id, home_zone_id, lat, lng (facultatifs, arrondis), transport_modes[], budget_profile (tight | balanced | comfort), activities[], updated_at
- `deals.price_level` (0 gratuit … 3) et `deals.tags[]` (ids d'activités)
- `profiles.followed_categories` est **ordonné** : les 3 premières sont les priorités
- `zones` : id (`bruz`, `ker-lann`, `rennes`), name, center_lat, center_lng, radius_m — coordonnées vérifiées (OpenStreetMap)
- `profiles` : id (= auth.users), username, role (student | merchant), followed_categories[], followed_zone_ids[], last_contribution_at, onboarded — **créé automatiquement à l'inscription** (trigger)
- `deals` : id, title, description, category, subcategory (transport uniquement), scope (local | zone | national ; local ⇒ lat/lng obligatoires), zone_id, place_name, lat, lng, price_info, expires_at, deadline_at, is_official (commerçants uniquement), ended_by_merchant, author_id (= auth.uid() par défaut), created_at
- `votes` : deal_id, user_id, value (+1 / -1), created_at — **un vote par utilisateur et par bon plan** : re-confirmer = `upsert` (created_at remis à now())
- `favorites` : (user_id, deal_id)
- Vue `user_contributions` : contributions (bons plans + votes) par utilisateur et catégorie, `count_7d` / `count_30d`
- Fonctions RPC : `has_full_access()`, `is_merchant()`, `active_users_in_zone(z)`
- Triggers : publier ou voter → `profiles.last_contribution_at = now()`

## Règles métier (`src/lib/rules.ts` + RLS)
- **Fiabilité** : moyenne des votes pondérée par l'ancienneté (demi-vie 48 h). Masqué si score < 0,3 ET nb de votes ≥ `minVotesToHide` = 5 % des utilisateurs actifs de la zone, borné entre 2 et 10. Masqué aussi si `ended_by_merchant` ou expiré.
- **Accès complet** si dernière contribution < 7 jours. Sinon, **la RLS cache les bons plans de moins de 24 h** (sauf les siens). ✅ 7 jours offerts à l'inscription.
- **Niveaux** (sur 7 jours) : ≥10 Très actif 🔥 · ≥3 Actif ✅ · ≥1 Peu actif 💤 · 0 Inactif 😴.

## Personnalisation (`src/lib/matching.ts`)
- Score sur 100 = points obtenus / points applicables (un critère non renseigné ne compte pas) : pôle de dépenses 40 (−4 par rang), localisation 25 (distance selon les transports, ou zone suivie), budget 20, activité ou transport emprunté 15.
- **« Pour toi »** : score ≥ 55, à portée, et catégorie suivie ou activité / transport aimé. Chaque carte affiche les raisons (« Ta priorité n°1 », « ≈ 8 min à vélo »…).
- Distances à vol d'oiseau depuis la position enregistrée, sinon le centre de la zone principale ; durées estimées.
- ⚠️ Next conserve les pages quittées (`<Activity>`) : les effets sont relancés au retour ; tout composant qui manipule le DOM (Leaflet) doit le supporter.
