// Faux Supabase pour la vidéo de démo : compte de Sarah, offres d'exemple autour de Bruz.
import http from "node:http";
const uid = "00000000-0000-0000-0000-000000000001";
const user = { id: uid, aud: "authenticated", role: "authenticated", email: "sarah@example.com", user_metadata: { location_consent: { allowed: true, version: "2026-11-28-plus-dispo", at: "2026-11-28T00:00:00Z" } }, app_metadata: {}, created_at: "2026-09-01T10:00:00Z" };
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: uid, exp: 4102444800, role: "authenticated" })}.sig`;
const h = (n) => new Date(Date.now() - n * 36e5).toISOString();
const day = 864e5;
const d = (id, title, category, lat, lng, place, extra = {}) => ({
  id, title, category, lat, lng, place_name: place, author_id: "other", scope: lat === null ? "national" : "local", zone_id: lat === null ? null : "bruz",
  description: "Exemple de démonstration.", price_info: null, price_level: 1, ended_by_merchant: false, ended_by: null, is_official: false,
  expires_at: null, deadline_at: null, archived_at: null, doubtful_since: null, reports_reset_at: null, tags: [], requirements: [], subcategory: null,
  link_url: null, photo_url: null, boosted_until: null, created_at: h(5), ...extra,
});
const deals = [
  d("menu", "Menu étudiant à 6,50 €", "restaurant", 48.0248, -1.7452, "Snack du Campus (démo)", { is_official: true, boosted_until: new Date(Date.now() + 3 * day).toISOString(), description: "Burger, frites et boisson, du lundi au vendredi, sur présentation de la carte étudiante.", requirements: ["student_card"], expires_at: new Date(Date.now() + 20 * day).toISOString() }),
  d("cine", "Place de ciné à 5 € le mardi", "activity", 48.0262, -1.7488, "Ciné des Étangs (démo)", { requirements: ["student_card"], tags: ["cinema"], description: "Toutes les séances du mardi, hors 3D." }),
  d("pates", "-20 % sur les pâtes et le riz", "supermarket", 48.0226, -1.7431, "Épicerie du Vert Buisson (démo)", { price_level: 0 }),
  d("cafe", "Café offert pour un sandwich acheté", "restaurant", 48.0239, -1.7497, "Café des Halles (démo)"),
  d("piscine", "Piscine à 2,50 € avec la Carte Sortir", "activity", 48.0285, -1.7440, "Piscine de la Vilaine (démo)", { requirements: ["carte_sortir"], tags: ["swimming"] }),
  d("bad", "Licence de badminton à moitié prix", "sport", 48.0214, -1.7479, "Club de Ker Lann (démo)", { requirements: ["student_card"] }),
  d("legumes", "Paniers de légumes à 4 €", "supermarket", 48.0271, -1.7415, "Marché étudiant (démo)", { price_level: 0 }),
  d("train", "Carte jeune : trains à prix réduit", "transport", null, null, null, { subcategory: "train", is_official: true }),
];
const vote = (id, i, value) => ({ deal_id: id, user_id: `${id}u${i}`, value, created_at: h(i + 1) });
let votes = [
  ...[...Array(12)].map((_, i) => vote("menu", i, 1)), ...[...Array(8)].map((_, i) => vote("cine", i, 1)),
  ...[...Array(3)].map((_, i) => vote("pates", i, 1)), vote("pates", 9, -1), ...[...Array(5)].map((_, i) => vote("cafe", i, 1)),
  vote("piscine", 0, 1), vote("piscine", 1, 1), vote("legumes", 0, 1), vote("legumes", 3, -1), vote("legumes", 4, -1),
];
let balance = 335, earned = 485, n = 0;
const favorites = new Set(["cine"]);
const rewards = [
  { id: "cafe", category: "local", title: "Café offert pour un sandwich acheté", partner: "Café des Halles (démo)", description: "Un café offert à l'achat d'un sandwich.", cost: 40, effect: null, active: true, sort: 1 },
  { id: "menu", category: "local", title: "Menu étudiant à 6,50 €", partner: "Snack du Campus (démo)", description: "Burger, frites et boisson.", cost: 90, effect: null, active: true, sort: 2 },
  { id: "raffle", category: "raffle", title: "Ticket de tombola", partner: "ShareWood", description: "Un ticket pour le tirage de la semaine.", cost: 60, effect: null, active: true, sort: 3 },
  { id: "early", category: "app", title: "Accès Avant-Première", partner: "ShareWood", description: "Vois les offres flash 1 h avant les autres.", cost: 150, effect: "early_access", active: true, sort: 4 },
];
const ownedRewards = [{ id: "ur1", reward_id: "cafe", cost: 40, code: "SW-DEMO01", created_at: h(30), used_at: null, drawn_at: null, won: null }];
const profile = { id: uid, username: "Sarah", role: "student", followed_categories: ["restaurant", "activity", "supermarket"], followed_zone_ids: ["bruz"], onboarded: true, created_at: "2026-09-01T10:00:00Z", privacy_accepted_at: "2026-09-01T10:00:00Z" };
const prefs = { user_id: uid, home_zone_id: "bruz", transport_modes: ["bike", "walk"], budget_profile: "tight", activities: ["cinema", "swimming"], travel_modes: [], home_visits: null, lat: null, lng: null, is_scholarship: null, has_carte_sortir: true, school: "ENSAI" };
const withVotes = (x) => ({ ...x, votes: votes.filter((v) => v.deal_id === x.id) });
const arrows = () => ({ total_arrows_earned: earned, current_arrows_balance: balance, golden_badge: false, early_access_until: null, pending: 0, streak: 3, today_votes: 1, history: [] });

http.createServer((req, res) => {
  const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "content-type": "application/json" };
  const send = (status, body) => { res.writeHead(status, headers); res.end(body === undefined ? "" : JSON.stringify(body)); };
  if (req.method === "OPTIONS") return send(204);
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const url = new URL(req.url, "http://x");
    const p = url.pathname;
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch {}
    const one = (row) => (String(req.headers.accept).includes("pgrst.object") ? send(200, row) : send(200, row ? [row] : []));
    const eq = (k) => (url.searchParams.get(k) || "").replace(/^eq\./, "");
    if (p === "/auth/v1/token") return send(200, { access_token: token, token_type: "bearer", expires_in: 3600, expires_at: 4102444800, refresh_token: "r", user });
    if (p === "/auth/v1/user") return send(200, user);
    if (p === "/rest/v1/rpc/is_merchant") return send(200, false);
    if (p === "/rest/v1/rpc/settle_doubtful_deals") return send(200, 0);
    if (p === "/rest/v1/rpc/my_arrows") return send(200, arrows());
    if (p === "/rest/v1/rpc/ensure_referral_code") return send(200, "WOOD-SARAH26");
    if (p === "/rest/v1/rpc/deal_visit_count") return send(200, 6);
    if (p === "/rest/v1/rpc/deal_trust") return send(200, (body.p_ids || []).map((id) => ({ deal_id: id, pos: votes.filter((v) => v.deal_id === id && v.value === 1).length, neg: votes.filter((v) => v.deal_id === id && v.value === -1).length })));
    if (p === "/rest/v1/rpc/react_to_deal") {
      votes = votes.filter((v) => !(v.deal_id === body.p_deal_id && v.user_id === uid));
      votes.push({ deal_id: body.p_deal_id, user_id: uid, value: body.p_value, created_at: new Date().toISOString() });
      if (body.p_value === 1) { balance += 15; earned += 15; }
      return send(200, { status: body.p_value === 1 ? "paid" : "pending", kind: body.p_value === 1 ? "confirm" : "report", amount: body.p_value === 1 ? 15 : 10, multiplier: 1.5, archived: false });
    }
    if (p === "/rest/v1/rpc/claim_creation_arrows") { balance += 75; earned += 75; return send(200, { status: "paid", amount: 75, multiplier: 1.5 }); }
    if (p.startsWith("/rest/v1/rpc/")) return send(404, { code: "PGRST202", message: "absent" });
    if (p === "/rest/v1/deal_visits") return req.method === "GET" ? send(200, []) : send(201);
    if (p === "/rest/v1/deal_views") return send(201);
    if (p === "/rest/v1/votes") return send(200, votes.filter((v) => v.deal_id === eq("deal_id")));
    if (p === "/rest/v1/favorites") {
      if (req.method === "POST") { favorites.add(body.deal_id); return send(201); }
      if (req.method === "DELETE") { favorites.delete(eq("deal_id")); return send(204); }
      return send(200, [...favorites].map((deal_id) => ({ deal_id })));
    }
    if (p === "/rest/v1/rewards") return send(200, rewards);
    if (p === "/rest/v1/user_rewards") return send(200, ownedRewards);
    if (p === "/rest/v1/profiles") return one(profile);
    if (p === "/rest/v1/preferences") return one(prefs);
    if (p === "/rest/v1/user_contributions") return send(200, [{ user_id: uid, category: "restaurant", count_7d: 4, count_30d: 9 }]);
    if (p === "/rest/v1/deals") {
      if (req.method === "POST") {
        const row = d("new" + ++n, body.title, body.category, body.lat ?? null, body.lng ?? null, body.place_name ?? null, { ...body, author_id: uid, created_at: new Date().toISOString() });
        deals.unshift(row);
        return String(req.headers.accept).includes("pgrst.object") ? send(201, { id: row.id }) : send(201, [{ id: row.id }]);
      }
      const id = url.searchParams.get("id") || "";
      if (id.startsWith("eq.")) return one(withVotes(deals.find((x) => x.id === id.slice(3))));
      if (url.searchParams.get("place_name")) return send(200, []);
      return send(200, deals.map(withVotes));
    }
    send(404, { code: "PGRST205", message: "absent" });
  });
}).listen(54399);
