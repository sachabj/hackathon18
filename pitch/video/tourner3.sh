#!/bin/bash
# Retourner les 3 vidéos de la diapo 3 (recherche, partager, récompenses) et préparer les images
# pour le paquet LaTeX `animate` dans pitch/images/ (macOS et Chrome requis, pas besoin de ffmpeg).
set -e
D="$(cd "$(dirname "$0")" && pwd)"; R="$D/../.."; W="$(mktemp -d)"
cd "$R"
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54399 NEXT_PUBLIC_SUPABASE_ANON_KEY=fake npm run -s build
node "$D/donnees-demo.mjs" > "$W/donnees.log" 2>&1 & F=$!
npx next start -p 3123 > "$W/serveur.log" 2>&1 & S=$!
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --remote-debugging-port=9333 --user-data-dir="$W/chrome" --hide-scrollbars about:blank > "$W/chrome.log" 2>&1 & C=$!
for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3123/login && curl -s -o /dev/null http://127.0.0.1:9333/json && break; sleep 0.5; done
node "$D/tournage3.mjs" "$W"
kill $F $S $C 2>/dev/null; wait 2>/dev/null || true
node "$D/rechantillonner.mjs" "$W" "$R/pitch/images"
# Remettre la vraie configuration pour la suite.
npm run -s build > /dev/null
echo "Images prêtes dans pitch/images/ (anim recherche/partager/recompenses) ; recompiler le PDF (xelatex) pour les intégrer."
