// Ré-échantillonne les images brutes (rythme irrégulier du screencast) vers un flux à fréquence
// fixe, au nom attendu par le paquet LaTeX `animate` (ex. animrecherche0.jpg, animrecherche1.jpg...).
import fs from "node:fs";
const W = process.argv[2];
const DEST = process.argv[3];
const FPS = 8;
const MAX_FRAMES = 110;

fs.mkdirSync(DEST, { recursive: true });

for (const scene of ["recherche", "partager", "recompenses"]) {
  const frames = JSON.parse(fs.readFileSync(`${W}/${scene}.json`, "utf8"));
  const t0 = frames[0].t, t1 = frames[frames.length - 1].t;
  const duration = t1 - t0;
  const n = Math.min(MAX_FRAMES, Math.max(1, Math.round(duration * FPS)));
  let j = 0;
  for (let i = 0; i < n; i++) {
    const targetT = t0 + (i * duration) / (n - 1 || 1);
    while (j < frames.length - 1 && frames[j + 1].t <= targetT) j++;
    fs.copyFileSync(`${W}/${scene}/${frames[j].name}`, `${DEST}/anim${scene}${i}.jpg`);
  }
  console.log(scene, ": durée", duration.toFixed(1), "s ·", n, "images ·", (n / duration).toFixed(1), "im/s réelles pour", FPS, "im/s déclarées");
}
