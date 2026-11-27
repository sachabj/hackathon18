# hackathon18 — Waze-Etu, le Waze des bons plans étudiants

Projet du hackathon ENSAI (27–28 nov. 2026). Une app communautaire pour voir et signaler les bons plans étudiants (restaurants, grandes surfaces, transports, bourses, sport, Carte Sortir, activités).

**En ligne : https://hackathon18-t1lb.vercel.app**

## Démarrer
Prérequis : **Node.js 20.9 ou plus** (`node -v`), npm est installé avec. S'il manque (`command not found: npm`) :
- macOS : `brew install node`, ou l'installeur LTS de https://nodejs.org
- Windows : `winget install OpenJS.NodeJS.LTS`, ou l'installeur LTS de https://nodejs.org
- Linux (ou sans droits admin) : [nvm](https://github.com/nvm-sh/nvm) puis `nvm install --lts`

Rouvrir ensuite le terminal.

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
