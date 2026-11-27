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

## Modèle de données (brouillon)
- `deals` : id, title, description, category (restaurant | shop | transport), subcategory (train | plane | bus | carpool | null), location_name, lat, lng, price/discount, expires_at, created_at, author_id
- `votes` : id, deal_id, user_id, value (+1 / -1), created_at
- `users` : géré par l'auth

## API / Routes
_À définir._
