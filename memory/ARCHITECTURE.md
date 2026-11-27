# ARCHITECTURE

> ⚠️ Rien n'est encore codé. La stack ci-dessous est une **proposition à valider** par l'équipe (voir DECISIONS.md).

## Stack proposée (rapide à livrer en 25h)
- **Front** : Next.js (React) + Tailwind — web app responsive (marche sur mobile sans store)
- **Back / BDD / Auth** : Supabase (Postgres + auth + API auto) — pas de serveur à coder
- **Carte** : Leaflet + OpenStreetMap (gratuit, sans clé API)
- **Déploiement** : Vercel (URL publique pour la démo)

## Repo
https://github.com/sachabj/hackathon18.git — branche unique `main`, commits/push faits par Claude (voir CLAUDE.md).

## Arborescence
```
/
├── README.md
├── .gitignore             # inclut node_modules, .env*, .next…
├── CLAUDE.md              # protocole mémoire (lu par Claude Code)
├── .claude/settings.json  # hook qui injecte les .md à chaque prompt
├── memory/                # mémoire partagée du projet
└── (code à venir)
```

## Contraintes techniques
- Notif « sur place » : impossible de suivre la position en arrière-plan sur le web → démo avec une **position simulée** (ou `navigator.geolocation` quand l'app est ouverte). Vraies notifications push possibles plus tard via une PWA.

## Modèle de données (brouillon)
- `zones` : id, name (Bruz, Ker Lann…), center_lat, center_lng, radius_m
- `deals` : id, title, description, category (restaurant | supermarket | transport | scholarship | sport | carte_sortir | activity), subcategory (plane | train | bus | carpool | null), **scope (local | zone | national)**, zone_id (null si national), place_name, lat, lng (null si non localisé), price_info, expires_at, deadline_at (bourses / dates limites), is_official (posté par un commerçant), created_at, author_id
- `votes` : id, deal_id, user_id, value (+1 toujours dispo / -1 expiré), created_at → statut du bon plan = votes récents
- `profiles` : id (= user auth), username, followed_categories[], followed_zone_ids[], **last_active_at** (actif si < 7 jours), points
- `users` : géré par l'auth

## API / Routes
_À définir._
