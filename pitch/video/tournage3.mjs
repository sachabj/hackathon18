// Tournage des 3 vidéos de la diapo 3 (téléphones de la diapo « Comment ça marche ») :
// A. recherche (carte + barre de recherche) → réaction « J'en ai profité » → cœur favori
// B. partager un bon plan
// C. page récompenses (« Ciblés »)
// Même principe que tournage.mjs : parcours scripté, images capturées par Chrome (screencast).
const out = process.argv[2];
const fs = await import("node:fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const targets = await (await fetch("http://127.0.0.1:9333/json")).json();
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const logs = [];
let recording = false; let frames = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id) pending.get(m.id)?.(m);
  if (m.method === "Runtime.exceptionThrown") logs.push("EXC " + JSON.stringify(m.params.exceptionDetails).slice(0, 300));
  if (m.method === "Page.screencastFrame") {
    send("Page.screencastFrameAck", { sessionId: m.params.sessionId });
    if (!recording) return;
    const name = `f${String(frames.length).padStart(5, "0")}.jpg`;
    fs.writeFileSync(`${out}/${recording}/${name}`, Buffer.from(m.params.data, "base64"));
    frames.push({ name, t: m.params.metadata.timestamp });
  }
};
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.result?.value;
const waitFor = async (expr, ms = 15000) => { for (let t = 0; t < ms; t += 250) { if (await run(expr)) return true; await sleep(250); } logs.push("attente dépassée : " + expr.slice(0, 80)); return false; };

/** Repère visuel du toucher, puis vrai clic au même endroit. */
async function tap(expr, after = 900) {
  const visible = await run(`(() => { const e = ${expr}; if (!e) return null; const b = e.getBoundingClientRect(); return b.top >= 70 && b.bottom <= innerHeight - 80; })()`);
  if (visible === null) { logs.push("introuvable : " + expr.slice(0, 90)); return; }
  if (!visible) {
    await run(`(${expr}).scrollIntoView({ block: "center", behavior: "smooth" })`);
    await sleep(700);
  }
  const r = await run(`(() => { const e = ${expr}; const b = e.getBoundingClientRect(); const x = b.x + b.width / 2, y = b.y + b.height / 2; const hit = document.elementFromPoint(x, y); return { x, y, ok: !!hit && (e === hit || e.contains(hit) || hit.contains(e)) }; })()`);
  if (!r.ok) logs.push("cible masquée : " + expr.slice(0, 90));
  await run(`window.__tap(${r.x}, ${r.y})`);
  await sleep(260);
  for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: r.x, y: r.y, button: "left", clickCount: 1 });
  await sleep(after);
}
async function typeText(text, delay = 75) { for (const c of text) { await send("Input.insertText", { text: c }); await sleep(delay); } }
async function scroll(dy, x = 195, y = 500) {
  await send("Input.synthesizeScrollGesture", { x, y, yDistance: -dy, speed: 900, gestureSourceType: "touch" });
}
const byText = (sel, text) => `[...document.querySelectorAll(${JSON.stringify(sel)})].find(e => e.getClientRects().length && e.textContent.includes(${JSON.stringify(text)}))`;
const card = (title) => `${byText("article", title)}?.querySelector("button")`;
const marker = (title) => `document.querySelector(${JSON.stringify(`.leaflet-marker-icon[title="${title}"]`)})`;
/** Toucher un repère, en réessayant si sa fenêtre ne s'ouvre pas du premier coup (carte encore en mouvement). */
async function tapMarker(title, after = 900) {
  for (let i = 0; i < 3; i++) {
    await tap(marker(title), 300);
    if (await waitFor(`!!document.querySelector(".leaflet-popup")`, 2500)) { await sleep(after); return; }
  }
  logs.push("fenêtre jamais ouverte : " + title);
}

/** Démarre l'enregistrement d'une scène dans son propre dossier. */
function startScene(name) {
  fs.mkdirSync(`${out}/${name}`, { recursive: true });
  for (const f of fs.readdirSync(`${out}/${name}`)) fs.unlinkSync(`${out}/${name}/${f}`);
  frames = [];
  recording = name;
}
function endScene(name) {
  recording = false;
  fs.writeFileSync(`${out}/${name}.json`, JSON.stringify(frames));
  console.log(name, ": images :", frames.length);
}

await send("Runtime.enable");
await send("Page.enable");
await send("Browser.grantPermissions", { permissions: ["geolocation"] });
await send("Emulation.setGeolocationOverride", { latitude: 48.0252, longitude: -1.7466, accuracy: 15 });
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  window.__tap = (x, y) => {
    const s = document.createElement("div");
    s.style.cssText = "position:fixed;left:" + (x - 22) + "px;top:" + (y - 22) + "px;width:44px;height:44px;border-radius:50%;background:rgba(75,42,99,.35);border:2px solid rgba(255,255,255,.9);z-index:2147483647;pointer-events:none;transition:transform .45s ease-out,opacity .45s ease-out";
    document.documentElement.appendChild(s);
    requestAnimationFrame(() => { s.style.transform = "scale(1.6)"; s.style.opacity = "0"; });
    setTimeout(() => s.remove(), 600);
  };` });

// Connexion, hors caméra (session déjà ouverte dans ce profil Chrome : on passe directement).
await send("Page.navigate", { url: "http://localhost:3123/login" });
await sleep(1500);
if (await run(`!!document.querySelector('input[type="email"]')`)) {
  for (let i = 0; i < 5 && (await run(`document.querySelector('input[type="email"]').value`)) !== "sarah@example.com"; i++) {
    await run(`document.querySelector('input[type="email"]').focus()`); await send("Input.insertText", { text: "sarah@example.com" });
    await run(`document.querySelector('input[type="password"]').focus()`); await send("Input.insertText", { text: "motdepasse" });
    await sleep(500);
  }
  await run(`document.querySelector("form button:not([type])").click()`);
}
await waitFor(`location.pathname === "/" && document.querySelectorAll("article").length >= 5`, 20000);
await sleep(1500);
await send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
await sleep(300);

// ============================== A. Recherche (carte + barre de recherche) ==============================
await send("Page.navigate", { url: "http://localhost:3123/recherche" });
await waitFor(`document.querySelectorAll(".leaflet-marker-icon[title]").length >= 5`, 15000);
await sleep(1200);
startScene("recherche");
await sleep(1200); // laisser la carte finir de se centrer avant le premier toucher
// Par la carte : toucher un repère, puis le cœur dans sa fenêtre.
await tapMarker("Menu étudiant à 6,50 €", 1200);
await tap(`document.querySelector('.leaflet-popup button[title="Ajouter aux favoris"], .leaflet-popup button[title="Retirer des favoris"]')`, 1400);
await run(`document.querySelector(".leaflet-popup-close-button")?.click()`);
await sleep(800);
// Par la barre de recherche : chercher, toucher le résultat, le retrouver sur la carte, puis réagir.
await tap(`document.querySelector('input[type="search"]')`, 300);
await typeText("piscine");
await run(`document.activeElement.blur()`);
await sleep(1400);
await tap(card("Piscine à 2,50 €"), 1600);
await tapMarker("Piscine à 2,50 € avec la Carte Sortir", 1200);
await tap(byText(".leaflet-popup button", "J'en ai profité"), 300);
await waitFor(`document.body.innerText.includes("Flèches")`, 8000);
await sleep(2400);
endScene("recherche");

// ============================== B. Partager un bon plan ==============================
await send("Page.navigate", { url: "http://localhost:3123/publier" });
await waitFor(`!!document.querySelector('input[placeholder^="L\\'avantage"]')`, 15000);
await sleep(900);
startScene("partager");
await tap(byText("button", "Utiliser ma position actuelle"), 1300);
await tap(`document.querySelector('input[placeholder^="L\\'avantage"]')`, 200);
await typeText("Kebab à 5 € le midi");
await run(`document.activeElement.blur()`);
await sleep(400);
await tap(byText("form button", "Restaurants"), 900);
await tap(byText("form button", "Publier le bon plan"), 300);
await waitFor(`document.body.innerText.includes("Merci, bon plan publié")`, 10000);
await sleep(1600);
await tap(byText("a", "Voir sur la carte"), 2600);
endScene("partager");

// ============================== C. Récompenses (page « Ciblés ») ==============================
await send("Page.navigate", { url: "http://localhost:3123/favoris?onglet=recompenses" });
await waitFor(`document.body.innerText.includes("Boutique")`, 15000);
await sleep(1200);
startScene("recompenses");
await sleep(1600);
await scroll(500); await sleep(1800);
await scroll(500); await sleep(1800);
await scroll(-900); await sleep(1200);
endScene("recompenses");

await send("Page.stopScreencast");
console.log("erreurs :\n" + logs.join("\n"));
ws.close();
