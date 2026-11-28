# Retourner la vidéo de démo (macOS, Chrome et ffmpeg requis) : bash pitch/video/tourner.sh
# Données d'exemple locales (donnees-demo.mjs) : rien n'est envoyé à la vraie base.
set -e
D="$(cd "$(dirname "$0")" && pwd)"; R="$D/../.."; W="$(mktemp -d)"
cd "$R"
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54399 NEXT_PUBLIC_SUPABASE_ANON_KEY=fake npm run -s build
node "$D/donnees-demo.mjs" > "$W/donnees.log" 2>&1 & F=$!
npx next start -p 3123 > "$W/serveur.log" 2>&1 & S=$!
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --remote-debugging-port=9333 --user-data-dir="$W/chrome" --hide-scrollbars about:blank > "$W/chrome.log" 2>&1 & C=$!
for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3123/login && curl -s -o /dev/null http://127.0.0.1:9333/json && break; sleep 0.5; done
node "$D/tournage.mjs" "$W"
kill $F $S $C 2>/dev/null; wait 2>/dev/null || true
node -e 'const f = require(process.argv[1] + "/frames.json"); let s = ""; f.forEach((x, i) => { const d = i < f.length - 1 ? f[i + 1].t - x.t : 1.5; s += `file frames/${x.name}\nduration ${Math.max(d, 0.001).toFixed(4)}\n`; }); s += `file frames/${f.at(-1).name}\n`; require("fs").writeFileSync(process.argv[1] + "/list.txt", s);' "$W"
(cd "$W" && ffmpeg -loglevel error -y -f concat -safe 0 -i list.txt -vf "fps=30,scale=780:1688:flags=lanczos,format=yuv420p" -c:v libx264 -crf 20 -preset slow -movflags +faststart "$R/pitch/demo-telephone.mp4")
ffmpeg -loglevel error -y -i "$R/pitch/demo-telephone.mp4" -vf "scale=-2:1000:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0xF1EFE9,format=yuv420p" -c:v libx264 -crf 20 -preset slow -movflags +faststart "$R/pitch/demo-16x9.mp4"
# Remettre la vraie configuration pour la suite.
npm run -s build > /dev/null
echo "Vidéos : pitch/demo-telephone.mp4 et pitch/demo-16x9.mp4"
