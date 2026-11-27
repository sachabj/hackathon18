"use client";

// Formulaire « Partager un bon plan » (tâche 6). Responsable : Matteo.
// Lieu précis : nom du magasin + ville → recherche Photon (OpenStreetMap) → choix du lieu exact.
// Doublons sans IA (tâche 27) : offres déjà partagées au même établissement, affichées dès le choix du
// lieu ; pour une zone / partout, offres de même catégorie vérifiées au clic sur « Publier ».
import Link from "next/link";
import { useRef, useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";
import ChoiceTile from "@/components/preferences/ChoiceTile";
import { BuildingsIcon, GlobeIcon, LinkIcon, PinIcon, ThumbsUpIcon } from "@/components/icons";
import type { AssistDraft } from "@/lib/ai/types";
import { ACTIVITIES, CATEGORIES, PRICE_LEVELS, REQUIREMENTS, SUBCATEGORIES, ZONES } from "@/lib/constants";
import { dealsAtPlace, similarAreaDeals, type ExistingDeal } from "@/lib/duplicates";
import { distanceKm, nearestZone } from "@/lib/geo";
import { normalizeLink } from "@/lib/links";
import { kindLabel, searchPlaces, suggestActivity, suggestCategory, type Place } from "@/lib/places";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ActivityId, DealCategory, DealRequirement, DealScope, DealSubcategory } from "@/lib/types";
import { uploadDealPhoto } from "@/lib/photos";
import { usePreferences } from "@/lib/usePreferences";
import AssistPanel from "./AssistPanel";

const SCOPES: { id: DealScope; Icon: typeof PinIcon; label: string; hint: string }[] = [
  { id: "local", Icon: PinIcon, label: "Dans un lieu", hint: "Un magasin, un resto… (sur la carte)" },
  { id: "zone", Icon: BuildingsIcon, label: "Sur une zone", hint: "Valable dans toute une ville" },
  { id: "national", Icon: GlobeIcon, label: "Partout", hint: "Offre nationale, en ligne…" },
];

/** Catégories où une date limite (dossier, inscription) a du sens. */
const DEADLINE_CATEGORIES: DealCategory[] = ["scholarship", "sport", "transport"];

/** Ville à proposer pour une zone (Ker Lann est sur la commune de Bruz). */
const CITY_OF_ZONE: Record<string, string> = { bruz: "Bruz", "ker-lann": "Bruz", rennes: "Rennes" };

const keys = <K extends string>(record: Record<K, unknown>) => Object.keys(record) as K[];
const toggle = <T,>(list: T[], item: T) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

/** Fin de journée locale → ISO, pour qu'une offre « jusqu'au 15 » reste visible le 15. */
const endOfDay = (date: string) => (date ? new Date(`${date}T23:59:59`).toISOString() : null);

const inputClass = "sw-field";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div>
        <h2 className="font-medium" style={{ color: "var(--color-ink)" }}>{title}</h2>
        {hint && <p className="text-xs text-[var(--color-muted)]">{hint}</p>}
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
      className="rounded-full border px-3 py-1.5 text-sm transition active:scale-95"
      style={
        selected
          ? { borderColor: "var(--color-forest)", backgroundColor: "var(--color-sage)", color: "var(--color-forest)", fontWeight: 500 }
          : { borderColor: "var(--color-border)", color: "var(--color-ink)" }
      }
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
  /** Conditions pour en profiter (carte étudiante, Carte Sortir…) et lien vers l'offre (migration 012). */
  const [requirements, setRequirements] = useState<DealRequirement[]>([]);
  const [link, setLink] = useState("");
  // Envoi
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | "published" | "confirmed">(null);
  /** Photo analysée par l'IA, jointe au bon plan comme preuve. */
  const [proofPhoto, setProofPhoto] = useState<{ data: string; preview: string } | null>(null);
  // La photo n'est publiée que sur accord explicite (confidentialité).
  const [sharePhoto, setSharePhoto] = useState(false);
  /** Offres déjà partagées au même établissement (null = pas encore cherché). */
  const [atPlace, setAtPlace] = useState<ExistingDeal[] | null>(null);
  /** Zone / partout : offres semblables trouvées au clic sur « Publier », à départager par l'étudiant. */
  const [similar, setSimilar] = useState<ExistingDeal[] | null>(null);
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
    setAtPlace(null);
    // Position GPS : pas d'établissement identifié, donc pas de recherche par nom de lieu.
    if (p.id !== "gps") {
      const name = [p.name, p.address].filter(Boolean).join(" · ");
      dealsAtPlace(name)
        .then(setAtPlace)
        .catch((err) => console.warn("Offres du lieu non chargées :", err));
    }
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
  function applyDraft(d: AssistDraft, photo: { data: string; preview: string } | null) {
    setSimilar(null);
    if (photo) {
      setProofPhoto(photo);
      setSharePhoto(false);
    }
    if (d.title) setTitle(d.title.slice(0, 80));
    if (d.category) setCategory(d.category);
    setSubcategory(d.category === "transport" ? d.subcategory : null);
    if (d.price_info) setPriceInfo(d.price_info.slice(0, 80));
    if (d.price_level !== null) setPriceLevel(d.price_level);
    if (d.description) setDescription(d.description.slice(0, 500));
    if (d.tags.length) setTags(d.tags);
    if (d.requirements?.length) setRequirements(d.requirements);
    if (d.link_url) setLink(d.link_url);
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
    setRequirements([]);
    setLink("");
    setProofPhoto(null);
    setSharePhoto(false);
    setError(null);
    setAtPlace(null);
    setSimilar(null);
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

  /**
   * Bouton « Publier ». Lieu précis : les offres du même établissement sont déjà affichées sous le lieu,
   * on publie directement. Zone / partout : on cherche d'abord les offres semblables (sans IA).
   */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return setError("Supabase n'est pas encore configuré.");
    if (!title.trim()) return setError("Donne un titre au bon plan.");
    if (!category) return setError("Choisis une catégorie.");
    if (scope === "local" && !place) return setError("Choisis le lieu exact dans la liste (ou utilise ta position).");
    try {
      normalizeLink(link);
    } catch (err) {
      return setError((err as Error).message);
    }
    if (scope === "local") return publish();

    setSubmitting(true);
    setError(null);
    try {
      const found = await similarAreaDeals({ category, scope, zone_id: dealZoneId() });
      if (found.length === 0) return await publish();
      setSimilar(found);
      setSubmitting(false);
    } catch (err) {
      // La recherche de doublons est un plus : en cas d'erreur, on publie quand même.
      console.warn("Recherche de doublons ignorée :", err);
      await publish();
    }
  }

  /** « C'est la même offre » : on confirme l'existante (vote 👍) au lieu d'en créer une seconde. */
  async function confirmExisting(dealId: string) {
    setSubmitting(true);
    setError(null);
    const { error } = await getSupabase()
      .from("votes")
      .upsert({ deal_id: dealId, value: 1 }, { onConflict: "deal_id,user_id" });
    setSubmitting(false);
    if (error) return setError(`Confirmation impossible : ${error.message}`);
    setSimilar(null);
    setDone("confirmed");
  }

  async function publish() {
    if (!category) return;
    let link_url: string | null;
    try {
      link_url = normalizeLink(link);
    } catch (err) {
      return setError((err as Error).message);
    }
    setSubmitting(true);
    setError(null);
    // Photo de preuve (celle analysée par l'IA), si l'étudiant l'a accepté : si le dépôt échoue, on publie sans elle.
    let photo_url: string | null = null;
    if (proofPhoto && sharePhoto) {
      try {
        photo_url = await uploadDealPhoto(proofPhoto.data);
      } catch (err) {
        console.warn("Photo de preuve non enregistrée :", err);
      }
    }
    const row: Record<string, unknown> = {
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
        // Colonnes de la migration 012 : envoyées seulement si remplies.
        ...(requirements.length > 0 && { requirements }),
        ...(link_url && { link_url }),
    };
    const supabase = getSupabase();
    let { error } = await supabase.from("deals").insert(photo_url ? { ...row, photo_url } : row);
    // Migration 008 pas encore lancée : la colonne photo_url n'existe pas → on publie sans la photo.
    if (error && photo_url && /photo_url/.test(error.message)) {
      ({ error } = await supabase.from("deals").insert(row));
    }
    setSubmitting(false);
    if (error) return setError(`Publication impossible : ${error.message}`);
    setSimilar(null);
    setDone("published");
  }

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 text-center">
        <ThumbsUpIcon className="h-12 w-12 text-[var(--color-forest)]" />
        <h1 className="mt-4 text-2xl">{done === "confirmed" ? "Bon plan validé" : "Merci, bon plan publié !"}</h1>
        {done === "confirmed" && (
          <p className="mt-2 text-sm" style={{ color: "var(--color-ink)" }}>
            Ta confirmation rend l&apos;offre plus fiable pour les autres étudiants.
          </p>
        )}
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Ta contribution te donne 7 jours d&apos;accès complet aux nouveaux bons plans.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3">
          <Link href="/recherche" className="sw-btn-primary">
            Voir sur la carte
          </Link>
          <button type="button" onClick={reset} className="sw-btn-secondary">
            Partager un autre bon plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-8 pt-6">
      <div>
        <h1 className="text-2xl">Partager un bon plan</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Les autres étudiants pourront le confirmer ou le signaler.</p>
      </div>

      <AssistPanel onDraft={applyDraft} />

      <Section title="Où ça se passe ?">
        <div className="grid grid-cols-3 gap-2">
          {SCOPES.map((s) => (
            <ChoiceTile
              key={s.id}
              icon={<s.Icon className="h-7 w-7" />}
              label={s.label}
              selected={scope === s.id}
              onClick={() => {
                setScope(s.id);
                setSimilar(null);
              }}
            />
          ))}
        </div>
        <p className="text-xs text-[var(--color-muted)]">{SCOPES.find((s) => s.id === scope)?.hint}</p>
      </Section>

      {scope === "local" && (
        <Section title="Le lieu" hint="Nom du magasin et ville, puis choisis le bon lieu dans la liste.">
          {place ? (
            <div className="flex items-start gap-3 rounded-2xl border-2 p-3" style={{ borderColor: "var(--color-forest)", backgroundColor: "var(--color-sage)" }}>
              <PinIcon className="h-6 w-6 shrink-0 text-[var(--color-forest)]" />
              <div className="min-w-0 flex-1">
                <p className="font-medium" style={{ color: "var(--color-forest)" }}>{place.name}</p>
                <p className="text-sm" style={{ color: "var(--color-ink)" }}>{place.address}</p>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=18/${place.lat}/${place.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline"
                  style={{ color: "var(--color-forest)" }}
                >
                  Vérifier sur la carte
                </a>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPlace(null);
                  setAtPlace(null);
                }}
                className="text-sm font-medium"
                style={{ color: "var(--color-forest)" }}
              >
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
                  className="sw-btn-primary shrink-0 px-4 disabled:opacity-50"
                >
                  {searching ? "…" : "Rechercher"}
                </button>
              </div>
              {results && results.length > 0 && (
                <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                  {results.map((p) => {
                    const km = distanceKm(p, { lat: ZONES[0].lat, lng: ZONES[0].lng });
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => choosePlace(p)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{p.name}</span>
                            <span className="block truncate text-xs text-[var(--color-muted)]">
                              {[kindLabel(p.kind), p.address || "Adresse inconnue"].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          {km > 30 && <span className="shrink-0 text-xs" style={{ color: "var(--color-aubergine)" }}>loin de Bruz</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {searchError && <p className="text-sm text-red-600">{searchError}</p>}
              <button type="button" onClick={useMyPosition} className="flex items-center gap-1.5 self-start text-sm font-medium" style={{ color: "var(--color-forest)" }}>
                <PinIcon className="h-4 w-4" /> Pas dans la liste ? Utiliser ma position actuelle
              </button>
            </>
          )}
          {place && atPlace && atPlace.length > 0 && (
            <ExistingDeals
              title={`Déjà partagé ici (${atPlace.length})`}
              hint="Ton offre est dans la liste ? Confirme-la plutôt que d'en créer une seconde. Sinon, continue ci-dessous."
              deals={atPlace}
              busy={submitting}
              onConfirm={confirmExisting}
            />
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
              icon={<CategoryIcon category={c} size={32} />}
              label={CATEGORIES[c].label}
              selected={category === c}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>
        {category === "transport" && (
          <div className="flex flex-wrap gap-2 pt-1">
            {keys(SUBCATEGORIES).map((s) => {
              const { Icon, label } = SUBCATEGORIES[s];
              return (
                <Chip key={s} selected={subcategory === s} onClick={() => setSubcategory(subcategory === s ? null : s)}>
                  <span className="flex items-center gap-1">
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </span>
                </Chip>
              );
            })}
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

      <Section title="Détails" hint="Jours, horaires, comment en profiter…">
        <textarea
          className={`${inputClass} min-h-24`}
          placeholder="Ex : du lundi au jeudi, hors supplément 3D"
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Section>

      <Section title="Conditions" hint="Facultatif : ce qu'il faut avoir pour en profiter.">
        <div className="flex flex-wrap gap-2">
          {keys(REQUIREMENTS).map((r) => {
            const { Icon, label } = REQUIREMENTS[r];
            return (
              <Chip key={r} selected={requirements.includes(r)} onClick={() => setRequirements(toggle(requirements, r))}>
                <span className="flex items-center gap-1">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </span>
              </Chip>
            );
          })}
        </div>
      </Section>

      <Section title="Lien vers l'offre" hint="Facultatif : page du magasin, billetterie, formulaire d'inscription…">
        <div className="relative">
          <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            className={inputClass}
            // Texte et non « url » : « www.exemple.fr » est accepté puis complété en https://.
            type="text"
            inputMode="url"
            style={{ paddingLeft: "2.25rem" }}
            autoComplete="url"
            placeholder="https://www.exemple.fr/offre"
            maxLength={500}
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
      </Section>

      <Section title="Activités liées" hint="Facultatif : aide à le proposer aux bons étudiants.">
        <div className="flex flex-wrap gap-2">
          {keys(ACTIVITIES).map((a) => {
            const { Icon, label } = ACTIVITIES[a];
            return (
              <Chip key={a} selected={tags.includes(a)} onClick={() => setTags(toggle(tags, a))}>
                <span className="flex items-center gap-1">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </span>
              </Chip>
            );
          })}
        </div>
      </Section>

      <Section title="Dates" hint="Facultatif.">
        <label className="block text-sm" style={{ color: "var(--color-ink)" }}>
          Fin de l&apos;offre
          <input type="date" className={`${inputClass} mt-1`} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </label>
        {category && DEADLINE_CATEGORIES.includes(category) && (
          <label className="block text-sm" style={{ color: "var(--color-ink)" }}>
            Date limite pour en profiter (dossier, inscription…)
            <input type="date" className={`${inputClass} mt-1`} value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} />
          </label>
        )}
      </Section>

      {proofPhoto && (
        <div className="flex items-center gap-3 rounded-2xl border p-2" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (data URL) */}
          <img src={proofPhoto.preview} alt="Photo de preuve" className="h-14 w-14 rounded-lg object-cover" />
          <label className="flex flex-1 items-start gap-2 text-sm" style={{ color: "var(--color-ink)" }}>
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              checked={sharePhoto}
              onChange={(e) => setSharePhoto(e.target.checked)}
            />
            Publier cette photo comme preuve (visible par tous)
          </label>
          <button type="button" onClick={() => setProofPhoto(null)} className="text-sm font-medium text-[var(--color-muted)]">
            Retirer
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {similar ? (
        <div className="space-y-3">
          <ExistingDeals
            title="Une offre semblable existe peut-être déjà"
            hint="Même catégorie, même zone. Si c'est la même, confirme-la ; sinon publie la tienne."
            deals={similar}
            busy={submitting}
            onConfirm={confirmExisting}
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setSimilar(null)} className="sw-btn-secondary flex-1">
              Modifier
            </button>
            <button type="button" disabled={submitting} onClick={publish} className="sw-btn-primary flex-1 disabled:opacity-50">
              {submitting ? "Publication…" : "Non, publier la mienne"}
            </button>
          </div>
        </div>
      ) : (
        <button disabled={submitting} className="sw-btn-primary text-lg">
          {submitting ? "Vérification…" : "Publier le bon plan"}
        </button>
      )}
    </form>
  );
}

/** Offres déjà partagées : « C'est la même » confirme l'existante (sauf la sienne, qu'on ne vote pas). */
function ExistingDeals({
  title,
  hint,
  deals,
  busy,
  onConfirm,
}: {
  title: string;
  hint: string;
  deals: ExistingDeal[];
  busy: boolean;
  onConfirm: (dealId: string) => void;
}) {
  return (
    <section
      className="sw-card space-y-3 p-3"
      style={{ borderColor: "var(--color-aubergine)", borderWidth: 2, backgroundColor: "var(--color-lilac)" }}
      aria-live="polite"
    >
      <div>
        <h3 className="font-medium" style={{ color: "var(--color-aubergine)" }}>{title}</h3>
        <p className="text-xs" style={{ color: "var(--color-ink)" }}>{hint}</p>
      </div>
      <ul className="space-y-2">
        {deals.map((d) => (
          <li key={d.id} className="space-y-2 rounded-xl p-3" style={{ backgroundColor: "var(--color-surface)" }}>
            <p className="text-sm">
              <span className="font-medium">{d.title}</span>
              {d.price_info && <span className="text-[var(--color-muted)]"> · {d.price_info}</span>}
            </p>
            {d.description && <p className="text-xs text-[var(--color-muted)]">{d.description}</p>}
            {d.mine ? (
              <p className="text-xs font-medium" style={{ color: "var(--color-forest)" }}>
                C&apos;est ton bon plan : tu peux le modifier depuis ton profil.
              </p>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => onConfirm(d.id)}
                className="sw-btn-primary py-2 text-sm disabled:opacity-50"
              >
                <ThumbsUpIcon className="h-4 w-4" /> C&apos;est la même offre
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
