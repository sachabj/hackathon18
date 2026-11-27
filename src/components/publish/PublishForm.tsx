"use client";

// Formulaire « Signaler un bon plan » (tâche 6). Responsable : Matteo.
// Lieu précis : nom du magasin + ville → recherche Photon (OpenStreetMap) → choix du lieu exact.
import Link from "next/link";
import { useRef, useState } from "react";
import ChoiceTile from "@/components/preferences/ChoiceTile";
import { AssistUnavailable, findDuplicateCandidates, reviewBeforePublish } from "@/lib/ai/client";
import type { AssistDraft, AssistReview, DuplicateCandidate } from "@/lib/ai/types";
import { ACTIVITIES, CATEGORIES, PRICE_LEVELS, SUBCATEGORIES, ZONES } from "@/lib/constants";
import { distanceKm, nearestZone } from "@/lib/geo";
import { kindLabel, searchPlaces, suggestActivity, suggestCategory, type Place } from "@/lib/places";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ActivityId, DealCategory, DealScope, DealSubcategory } from "@/lib/types";
import { usePreferences } from "@/lib/usePreferences";
import AssistPanel from "./AssistPanel";

const SCOPES: { id: DealScope; emoji: string; label: string; hint: string }[] = [
  { id: "local", emoji: "📍", label: "Dans un lieu", hint: "Un magasin, un resto… (sur la carte)" },
  { id: "zone", emoji: "🏙️", label: "Sur une zone", hint: "Valable dans toute une ville" },
  { id: "national", emoji: "🌍", label: "Partout", hint: "Offre nationale, en ligne…" },
];

/** Catégories où une date limite (dossier, inscription) a du sens. */
const DEADLINE_CATEGORIES: DealCategory[] = ["scholarship", "sport", "carte_sortir", "transport"];

/** Ville à proposer pour une zone (Ker Lann est sur la commune de Bruz). */
const CITY_OF_ZONE: Record<string, string> = { bruz: "Bruz", "ker-lann": "Bruz", rennes: "Rennes" };

const keys = <K extends string>(record: Record<K, unknown>) => Object.keys(record) as K[];
const toggle = <T,>(list: T[], item: T) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

/** Fin de journée locale → ISO, pour qu'une offre « jusqu'au 15 » reste visible le 15. */
const endOfDay = (date: string) => (date ? new Date(`${date}T23:59:59`).toISOString() : null);

const inputClass = "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-blue-600";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div>
        <h2 className="font-semibold text-zinc-900">{title}</h2>
        {hint && <p className="text-xs text-zinc-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-1.5 text-sm transition active:scale-95 ${
        selected ? "border-blue-600 bg-blue-50 font-semibold text-blue-700" : "border-zinc-300 bg-white text-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

export default function PublishForm() {
  const { preferences } = usePreferences();
  const homeZoneId = preferences?.home_zone_id ?? null;

  const [scope, setScope] = useState<DealScope>("local");
  // Lieu
  const [store, setStore] = useState("");
  // null = pas encore modifié : on propose la ville / la zone de l'étudiant.
  const [cityInput, setCity] = useState<string | null>(null);
  const city = cityInput ?? (homeZoneId ? CITY_OF_ZONE[homeZoneId] ?? "" : "");
  const [results, setResults] = useState<Place[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [zoneInput, setZoneId] = useState<string | null>(null);
  const zoneId = zoneInput ?? homeZoneId ?? ZONES[0].id;
  // Bon plan
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DealCategory | null>(null);
  const [subcategory, setSubcategory] = useState<DealSubcategory | null>(null);
  const [description, setDescription] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [priceLevel, setPriceLevel] = useState<number | null>(null);
  const [tags, setTags] = useState<ActivityId[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  // Envoi
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | "published" | "confirmed">(null);
  /** Relecture IA affichée avant publication (titre, modération, doublon). */
  const [review, setReview] = useState<{ result: AssistReview; duplicate: DuplicateCandidate | null } | null>(null);
  const searchAbort = useRef<AbortController | null>(null);

  async function runSearch(storeName = store, cityName = city) {
    if (!storeName.trim()) return setSearchError("Indique le nom du magasin.");
    searchAbort.current?.abort();
    const controller = new AbortController();
    searchAbort.current = controller;
    setSearching(true);
    setSearchError(null);
    setPlace(null);
    try {
      const found = await searchPlaces(storeName, cityName, controller.signal);
      setResults(found);
      if (found.length === 0) setSearchError("Aucun lieu trouvé : vérifie l'orthographe ou utilise ta position.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setSearchError((e as Error).message);
    } finally {
      if (searchAbort.current === controller) setSearching(false);
    }
  }

  function choosePlace(p: Place) {
    setPlace(p);
    setResults(null);
    setSearchError(null);
    const suggested = suggestCategory(p.kind);
    if (suggested && !category) setCategory(suggested);
    const activity = suggestActivity(p.kind);
    if (activity) setTags((t) => (t.includes(activity) ? t : [...t, activity]));
  }

  function useMyPosition() {
    if (!navigator.geolocation) return setSearchError("Localisation indisponible sur cet appareil.");
    setSearchError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        choosePlace({
          id: "gps",
          name: store.trim() || "Lieu signalé",
          address: "Ma position actuelle",
          city: null,
          lat: coords.latitude,
          lng: coords.longitude,
          kind: "",
        }),
      (e) =>
        setSearchError(
          e.code === e.PERMISSION_DENIED
            ? "Localisation refusée : autorise-la dans les réglages du navigateur."
            : "Position introuvable pour le moment.",
        ),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  /** Brouillon de l'IA → formulaire (seuls les champs trouvés remplacent la saisie). */
  function applyDraft(d: AssistDraft) {
    setReview(null);
    if (d.title) setTitle(d.title.slice(0, 80));
    if (d.category) setCategory(d.category);
    setSubcategory(d.category === "transport" ? d.subcategory : null);
    if (d.price_info) setPriceInfo(d.price_info.slice(0, 80));
    if (d.price_level !== null) setPriceLevel(d.price_level);
    if (d.description) setDescription(d.description.slice(0, 500));
    if (d.tags.length) setTags(d.tags);
    if (d.expires_on) setExpiresAt(d.expires_on);
    if (d.deadline_on) setDeadlineAt(d.deadline_on);
    if (d.scope) setScope(d.scope);
    const zone = ZONES.find((z) => d.city && z.name.toLowerCase() === d.city.trim().toLowerCase());
    if (d.scope === "zone" && zone) setZoneId(zone.id);
    // Commerce lu sur la photo ou dans le texte : on lance la recherche du lieu exact.
    if (d.store_name && d.scope !== "zone" && d.scope !== "national") {
      setScope("local");
      setStore(d.store_name);
      if (d.city) setCity(d.city);
      runSearch(d.store_name, d.city ?? city);
    }
  }

  function reset() {
    setStore("");
    setResults(null);
    setPlace(null);
    setTitle("");
    setCategory(null);
    setSubcategory(null);
    setDescription("");
    setPriceInfo("");
    setPriceLevel(null);
    setTags([]);
    setExpiresAt("");
    setDeadlineAt("");
    setError(null);
    setReview(null);
    setDone(null);
  }

  /** Bon plan localisé : rattaché à la zone la plus proche si le lieu est dans les environs. */
  function dealZoneId() {
    if (scope === "zone") return zoneId;
    if (scope === "local" && place) {
      const { zone, km } = nearestZone(place);
      if (km <= zone.radiusM / 1000 + 5) return zone.id;
    }
    return null;
  }

  const placeName = () =>
    scope === "local" && place ? [place.name, place.address].filter(Boolean).join(" · ") : null;

  /** Bouton « Publier » : relecture par l'IA d'abord ; si elle est indisponible, on publie quand même. */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return setError("Supabase n'est pas encore configuré.");
    if (!title.trim()) return setError("Donne un titre au bon plan.");
    if (!category) return setError("Choisis une catégorie.");
    if (scope === "local" && !place) return setError("Choisis le lieu exact dans la liste (ou utilise ta position).");

    setSubmitting(true);
    setError(null);
    try {
      const zone_id = dealZoneId();
      const candidates = await findDuplicateCandidates({
        category,
        scope,
        zone_id,
        lat: scope === "local" ? place?.lat ?? null : null,
        lng: scope === "local" ? place?.lng ?? null : null,
      });
      const result = await reviewBeforePublish(
        {
          title: title.trim(),
          category,
          place_name: placeName(),
          zone_id,
          price_info: priceInfo.trim() || null,
          description: description.trim() || null,
        },
        candidates,
      );
      const duplicate = candidates.find((c) => c.id === result.duplicate_of) ?? null;
      if (result.acceptable && result.title_ok && !duplicate) return await publish();
      setReview({ result, duplicate });
      setSubmitting(false);
    } catch (err) {
      // Assistant indisponible ou en erreur : la relecture est un plus, pas un passage obligé.
      if (!(err instanceof AssistUnavailable)) console.warn("Relecture IA ignorée :", err);
      await publish();
    }
  }

  /** Doublon : on confirme le bon plan existant (vote 👍) au lieu d'en créer un second. */
  async function confirmDuplicate(dealId: string) {
    setSubmitting(true);
    const { error } = await getSupabase()
      .from("votes")
      .upsert({ deal_id: dealId, value: 1 }, { onConflict: "deal_id,user_id" });
    setSubmitting(false);
    if (error) return setError(`Confirmation impossible : ${error.message}`);
    setReview(null);
    setDone("confirmed");
  }

  async function publish() {
    if (!category) return;
    setSubmitting(true);
    setError(null);
    const { error } = await getSupabase()
      .from("deals")
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        category,
        subcategory: category === "transport" ? subcategory : null,
        scope,
        zone_id: dealZoneId(),
        place_name: placeName(),
        lat: scope === "local" ? place?.lat : null,
        lng: scope === "local" ? place?.lng : null,
        price_info: priceInfo.trim() || null,
        price_level: priceLevel,
        tags,
        expires_at: endOfDay(expiresAt),
        deadline_at: category && DEADLINE_CATEGORIES.includes(category) ? endOfDay(deadlineAt) : null,
      });
    setSubmitting(false);
    if (error) return setError(`Publication impossible : ${error.message}`);
    setReview(null);
    setDone("published");
  }

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 text-center">
        <span className="text-6xl" aria-hidden>
          🎉
        </span>
        <h1 className="mt-4 text-2xl font-bold">
          {done === "confirmed" ? "Merci, bon plan confirmé 👍" : "Merci, bon plan publié !"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Ta contribution te donne 7 jours d&apos;accès complet aux nouveaux bons plans.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3">
          <Link href="/" className="rounded-xl bg-blue-600 py-3 font-semibold text-white">
            Voir sur la carte
          </Link>
          <button type="button" onClick={reset} className="rounded-xl border border-zinc-300 py-3 font-semibold">
            Signaler un autre bon plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-8 pt-6">
      <div>
        <h1 className="text-2xl font-bold">Signaler un bon plan</h1>
        <p className="mt-1 text-sm text-zinc-500">Les autres étudiants pourront le confirmer 👍 ou le signaler 👎.</p>
      </div>

      <AssistPanel onDraft={applyDraft} />

      <Section title="Où ça se passe ?">
        <div className="grid grid-cols-3 gap-2">
          {SCOPES.map((s) => (
            <ChoiceTile
              key={s.id}
              emoji={s.emoji}
              label={s.label}
              selected={scope === s.id}
              onClick={() => setScope(s.id)}
            />
          ))}
        </div>
        <p className="text-xs text-zinc-500">{SCOPES.find((s) => s.id === scope)?.hint}</p>
      </Section>

      {scope === "local" && (
        <Section title="Le lieu" hint="Nom du magasin et ville, puis choisis le bon lieu dans la liste.">
          {place ? (
            <div className="flex items-start gap-3 rounded-2xl border-2 border-blue-600 bg-blue-50 p-3">
              <span className="text-2xl" aria-hidden>
                📍
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-blue-700">{place.name}</p>
                <p className="text-sm text-zinc-600">{place.address}</p>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=18/${place.lat}/${place.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 underline"
                >
                  Vérifier sur la carte
                </a>
              </div>
              <button type="button" onClick={() => setPlace(null)} className="text-sm font-semibold text-blue-600">
                Changer
              </button>
            </div>
          ) : (
            <>
              <input
                className={inputClass}
                placeholder="Magasin (ex : Intermarché, McDonald's…)"
                value={store}
                onChange={(e) => setStore(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runSearch();
                  }
                }}
              />
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  placeholder="Ville (ex : Bruz)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      runSearch();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => runSearch()}
                  disabled={searching}
                  className="shrink-0 rounded-xl bg-blue-600 px-4 font-semibold text-white disabled:opacity-50"
                >
                  {searching ? "…" : "Rechercher"}
                </button>
              </div>
              {results && results.length > 0 && (
                <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                  {results.map((p) => {
                    const km = distanceKm(p, { lat: ZONES[0].lat, lng: ZONES[0].lng });
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => choosePlace(p)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left active:bg-blue-50"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{p.name}</span>
                            <span className="block truncate text-xs text-zinc-500">
                              {[kindLabel(p.kind), p.address || "Adresse inconnue"].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          {km > 30 && <span className="shrink-0 text-xs text-amber-600">loin de Bruz</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {searchError && <p className="text-sm text-red-600">{searchError}</p>}
              <button type="button" onClick={useMyPosition} className="self-start text-sm font-semibold text-blue-600">
                📍 Pas dans la liste ? Utiliser ma position actuelle
              </button>
            </>
          )}
        </Section>
      )}

      {scope === "zone" && (
        <Section title="La zone">
          <div className="flex flex-wrap gap-2">
            {ZONES.map((z) => (
              <Chip key={z.id} selected={zoneId === z.id} onClick={() => setZoneId(z.id)}>
                {z.name}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      <Section title="Titre">
        <input
          className={inputClass}
          placeholder="Ex : -20 % sur le menu étudiant"
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </Section>

      <Section title="Catégorie" hint={place && category ? "Proposée d'après le lieu, modifiable." : undefined}>
        <div className="grid grid-cols-3 gap-2">
          {keys(CATEGORIES).map((c) => (
            <ChoiceTile
              key={c}
              emoji={CATEGORIES[c].emoji}
              label={CATEGORIES[c].label}
              selected={category === c}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>
        {category === "transport" && (
          <div className="flex flex-wrap gap-2 pt-1">
            {keys(SUBCATEGORIES).map((s) => (
              <Chip key={s} selected={subcategory === s} onClick={() => setSubcategory(subcategory === s ? null : s)}>
                {SUBCATEGORIES[s].emoji} {SUBCATEGORIES[s].label}
              </Chip>
            ))}
          </div>
        )}
      </Section>

      <Section title="Prix ou réduction" hint="Ce que l'étudiant paie ou économise.">
        <input
          className={inputClass}
          placeholder="Ex : 6 € au lieu de 9 €, 2 pour 1, gratuit…"
          maxLength={80}
          value={priceInfo}
          onChange={(e) => setPriceInfo(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {PRICE_LEVELS.map((p) => (
            <Chip
              key={p.value}
              selected={priceLevel === p.value}
              onClick={() => setPriceLevel(priceLevel === p.value ? null : p.value)}
            >
              {p.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Détails et conditions" hint="Jours, horaires, carte étudiante obligatoire…">
        <textarea
          className={`${inputClass} min-h-24`}
          placeholder="Ex : du lundi au jeudi, sur présentation de la carte étudiante"
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Section>

      <Section title="Activités liées" hint="Facultatif : aide à le proposer aux bons étudiants.">
        <div className="flex flex-wrap gap-2">
          {keys(ACTIVITIES).map((a) => (
            <Chip key={a} selected={tags.includes(a)} onClick={() => setTags(toggle(tags, a))}>
              {ACTIVITIES[a].emoji} {ACTIVITIES[a].label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Dates" hint="Facultatif.">
        <label className="block text-sm text-zinc-700">
          Fin de l&apos;offre
          <input type="date" className={`${inputClass} mt-1`} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </label>
        {category && DEADLINE_CATEGORIES.includes(category) && (
          <label className="block text-sm text-zinc-700">
            Date limite pour en profiter (dossier, inscription…)
            <input type="date" className={`${inputClass} mt-1`} value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} />
          </label>
        )}
      </Section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {review ? (
        <ReviewPanel
          review={review}
          busy={submitting}
          onUseTitle={(t) => {
            setTitle(t);
            setReview({ ...review, result: { ...review.result, title_ok: true, suggested_title: null, title_issue: null } });
          }}
          onConfirmDuplicate={confirmDuplicate}
          onNotDuplicate={() => setReview({ ...review, duplicate: null })}
          onPublish={publish}
          onEdit={() => setReview(null)}
        />
      ) : (
        <button
          disabled={submitting}
          className="rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Vérification…" : "Publier le bon plan"}
        </button>
      )}
    </form>
  );
}

/** Résultat de la relecture IA : titre à améliorer, contenu refusé ou doublon possible. */
function ReviewPanel({
  review: { result, duplicate },
  busy,
  onUseTitle,
  onConfirmDuplicate,
  onNotDuplicate,
  onPublish,
  onEdit,
}: {
  review: { result: AssistReview; duplicate: DuplicateCandidate | null };
  busy: boolean;
  onUseTitle: (title: string) => void;
  onConfirmDuplicate: (dealId: string) => void;
  onNotDuplicate: () => void;
  onPublish: () => void;
  onEdit: () => void;
}) {
  const blocked = !result.acceptable;
  return (
    <section className="space-y-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3" aria-live="polite">
      <h2 className="font-semibold text-zinc-900">✨ Avant de publier</h2>

      {blocked && (
        <p className="text-sm text-red-700">🚫 {result.rejection_reason ?? "Ce contenu ne peut pas être publié."}</p>
      )}

      {!blocked && duplicate && (
        <div className="space-y-2 rounded-xl bg-white p-3">
          <p className="text-sm font-semibold">Ce bon plan existe peut-être déjà :</p>
          <p className="text-sm">
            <span className="font-medium">{duplicate.title}</span>
            {duplicate.place_name && <span className="text-zinc-500"> · {duplicate.place_name}</span>}
          </p>
          {result.duplicate_reason && <p className="text-xs text-zinc-500">{result.duplicate_reason}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onConfirmDuplicate(duplicate.id)}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              👍 C&apos;est le même : je le confirme
            </button>
            <button type="button" onClick={onNotDuplicate} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold">
              Ce n&apos;est pas le même
            </button>
          </div>
        </div>
      )}

      {!blocked && !result.title_ok && result.suggested_title && (
        <div className="space-y-2 rounded-xl bg-white p-3">
          <p className="text-sm">
            <span className="font-semibold">Titre : </span>
            {result.title_issue ?? "il peut être plus clair."}
          </p>
          <button
            type="button"
            onClick={() => onUseTitle(result.suggested_title!)}
            className="w-full rounded-xl border border-blue-600 px-3 py-2 text-left text-sm text-blue-700"
          >
            Utiliser « {result.suggested_title} »
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={onEdit} className="flex-1 rounded-xl border border-zinc-300 bg-white py-3 font-semibold">
          Modifier
        </button>
        {!blocked && !duplicate && (
          <button
            type="button"
            disabled={busy}
            onClick={onPublish}
            className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Publication…" : "Publier"}
          </button>
        )}
      </div>
    </section>
  );
}
