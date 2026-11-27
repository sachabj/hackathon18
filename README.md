# hackathon18 — Waze-Etu, le Waze des bons plans étudiants

Projet du hackathon ENSAI (27–28 nov. 2026). Une app communautaire pour voir et signaler les bons plans étudiants (restaurants, grandes surfaces, transports, bourses, sport, Carte Sortir, activités).

## Démarrer
```
git clone https://github.com/sachabj/hackathon18.git && cd hackathon18
npm install
cp .env.example .env.local   # remplir les clés Supabase
npm run dev                  # http://localhost:3000
```
Puis lancer `claude` dans le dossier : il lit `CLAUDE.md` et la mémoire (`memory/`) automatiquement.

- Vision, décisions, tâches : [`memory/`](memory/)
- Architecture et conventions : [`memory/ARCHITECTURE.md`](memory/ARCHITECTURE.md)
- Base de données : [`supabase/schema.sql`](supabase/schema.sql)
