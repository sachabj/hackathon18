// Tournage de la démo : parcours scripté sur téléphone, images capturées par Chrome (screencast).
const out = process.argv[2];
const fs = await import("node:fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const targets = await (await fetch("http://127.0.0.1:9333/json")).json();
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const logs = []; const frames = [];
let recording = false;
fs.mkdirSync(`${out}/frames`, { recursive: true });
for (const f of fs.readdirSync(`${out}/frames`)) fs.unlinkSync(`${out}/frames/${f}`);
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id) pending.get(m.id)?.(m);
  if (m.method === "Runtime.exceptionThrown") logs.push("EXC " + JSON.stringify(m.params.exceptionDetails).slice(0, 300));
  if (m.method === "Page.screencastFrame") {
    send("Page.screencastFrameAck", { sessionId: m.params.sessionId });
    if (!recording) return;
    const name = `f${String(frames.length).padStart(5, "0")}.jpg`;
    fs.writeFileSync(`${out}/frames/${name}`, Buffer.from(m.params.data, "base64"));
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

await send("Runtime.enable");
await send("Page.enable");
await send("Browser.grantPermissions", { permissions: ["geolocation"] });
await send("Emulation.setGeolocationOverride", { latitude: 48.0252, longitude: -1.7466, accuracy: 15 });
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
// Repère du toucher, ajouté à chaque page chargée.
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  window.__tap = (x, y) => {
    const s = document.createElement("div");
    s.style.cssText = "position:fixed;left:" + (x - 22) + "px;top:" + (y - 22) + "px;width:44px;height:44px;border-radius:50%;background:rgba(75,42,99,.35);border:2px solid rgba(255,255,255,.9);z-index:2147483647;pointer-events:none;transition:transform .45s ease-out,opacity .45s ease-out";
    document.documentElement.appendChild(s);
    requestAnimationFrame(() => { s.style.transform = "scale(1.6)"; s.style.opacity = "0"; });
    setTimeout(() => s.remove(), 600);
  };` });

// Connexion, hors caméra.
await send("Page.navigate", { url: "http://localhost:3123/login" });
await waitFor(`!!document.querySelector('input[type="email"]')`);
await sleep(3000);
for (let i = 0; i < 5 && (await run(`document.querySelector('input[type="email"]').value`)) !== "sarah@example.com"; i++) {
  await run(`document.querySelector('input[type="email"]').focus()`); await send("Input.insertText", { text: "sarah@example.com" });
  await run(`document.querySelector('input[type="password"]').focus()`); await send("Input.insertText", { text: "motdepasse" });
  await sleep(500);
}
await run(`document.querySelector("form button:not([type])").click()`);
await waitFor(`location.pathname === "/" && document.querySelectorAll("article").length >= 5`, 20000);
await sleep(2500);
await send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
await sleep(300);
const t0 = Date.now();
const mark = (label) => console.log(String(((Date.now() - t0) / 1000).toFixed(1)).padStart(5), "s", label);
recording = true;

// 1. Accueil « Pour toi »
mark("accueil");
await sleep(2600);
await scroll(380); await sleep(1300);
await scroll(-380); await sleep(1500);

// 2. Fiche d'une offre : fiabilité, conditions
mark("fiche");
await tap(card("Place de ciné à 5 €"), 2800);
await scroll(250, 195, 650); await sleep(1200);

// 3. « J'en ai profité » : Flèches gagnées
mark("réaction");
await tap(byText("[role=dialog] button", "J'en ai profité"), 300);
await waitFor(`document.body.innerText.includes("+15 Flèches")`, 8000);
await sleep(2600);
await tap(`document.querySelector('[role=dialog] button[aria-label="Fermer"]')`, 900);

// 4. Recherche et carte
mark("recherche");
await tap(`[...document.querySelectorAll('nav a[href="/recherche"]')].find(a => a.getClientRects().length)`, 300);
await waitFor(`document.querySelectorAll(".leaflet-marker-icon[title]").length >= 5`, 15000);
await sleep(3200);
await tap(`document.querySelector('input[type="search"]')`, 300);
await typeText("piscine");
await run(`document.activeElement.blur()`);
await sleep(2600);
await tap(card("Piscine à 2,50 €"), 2600);

// 5. Partager un bon plan en quelques gestes
mark("partager");
await tap(`[...document.querySelectorAll('nav a[href="/publier"]')].find(a => a.getClientRects().length)`, 1500);
await tap(byText("button", "Utiliser ma position actuelle"), 1500);
await tap(`document.querySelector('input[placeholder^="L\\'avantage"]')`, 200);
await typeText("Kebab à 5 € le midi");
await run(`document.activeElement.blur()`);
await sleep(400);
await tap(byText("form button", "Restaurants"), 900);
await tap(byText("form button", "Publier le bon plan"), 300);
await waitFor(`document.body.innerText.includes("Merci, bon plan publié")`, 10000);
await waitFor(`document.body.innerText.includes("+75 Flèches")`, 8000);
mark("publié");
await sleep(3200);
recording = false;
await send("Page.stopScreencast");
mark("fin");

fs.writeFileSync(`${out}/frames.json`, JSON.stringify(frames));
console.log("images :", frames.length, "· erreurs :", JSON.stringify(logs));
ws.close();
