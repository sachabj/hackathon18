"use client";

// Parcours « ton profil » : après l'inscription, puis pour modifier ses préférences. Responsable : Sacha.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LocationNotice from "@/components/location/LocationNotice";
import CategoryIcon from "@/components/CategoryIcon";
import {
  ArrowLeftIcon,
  CheckIcon,
  CloseIcon,
  PinIcon,
  SuitcaseIcon,
  TargetIcon,
} from "@/components/icons";
import {
  ACTIVITIES,
  BUDGET_PROFILES,
  CARTE_SORTIR_URL,
  CATEGORIES,
  ELIGIBILITY_CATEGORIES,
  HOME_VISITS,
  SUBCATEGORIES,
  TRANSPORT_MODES,
  TRAVEL_MODES,
} from "@/lib/constants";
import { distanceKm, formatDistance } from "@/lib/geo";
import { ensureLocationConsent } from "@/lib/location";
import { isTraveler, rankDeals, toStudentProfile, type StudentProfile } from "@/lib/matching";
import { fetchMyPreferences, saveMyPreferences } from "@/lib/preferences";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { ActivityId, BudgetProfile, DealCategory, HomeVisits, TransportMode } from "@/lib/types";
import { useDeals } from "@/lib/useDeals";
import { preferenceRows } from "@/components/profile/PreferencesSummary";
import CitySearch from "@/components/zones/CitySearch";
import { carteSortirArea, cityAt, ensureZone, useZones, zoneAround, zoneById } from "@/lib/zones";
import ChoiceTile from "./ChoiceTile";
import { useT } from "@/lib/i18n";

/** Villes suivies en plus de la ville principale. */
const MAX_OTHER_ZONES = 4;

const EMPTY: StudentProfile = {
  categories: [],
  zoneIds: [],
  homeZoneId: null,
  position: null,
  transportModes: [],
  budget: null,
  activities: [],
  homeVisits: null,
  travelModes: [],
  isScholar: null,
  hasCarteSortir: null,
};

const STEPS = [
  { id: "zone", title: "Où es-tu ?", subtitle: "Localise-toi, ou cherche ta ville : partout en France." },
  { id: "transport", title: "Au quotidien, tu te déplaces comment ?", subtitle: "Pour ne te proposer que ce qui est à ta portée. Plusieurs choix possibles." },
  { id: "travel", title: "Tu voyages à quelle fréquence ?", subtitle: "Longs trajets : pour repérer les billets et les covoiturages qui te serviront." },
  { id: "budget", title: "Ton budget ?", subtitle: "Visible uniquement par toi." },
  { id: "aids", title: "Tes aides", subtitle: "Pour ne te proposer que celles auxquelles tu as droit. Visible uniquement par toi." },
  { id: "categories", title: "Tes pôles de dépenses", subtitle: "Touche-les dans l'ordre d'importance : les 3 premiers sont tes priorités." },
  { id: "activities", title: "Qu'est-ce que tu aimes faire ?", subtitle: "On mettra ces sorties en avant." },
  { id: "recap", title: "Ton profil est prêt", subtitle: "Tu pourras le modifier quand tu veux." },
] as const;

const toggle = <T,>(list: T[], item: T) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

const keys = <K extends string>(record: Record<K, unknown>) => Object.keys(record) as K[];

export default function PreferencesWizard() {
  const t = useT();
  const router = useRouter();
  const { deals } = useDeals();
  const [step, setStep] = useState(0);
  /** Ouvert depuis le profil sur une seule rubrique : on enregistre et on y retourne. */
  const [single, setSingle] = useState(false);
  const [me, setMe] = useState<StudentProfile>(EMPTY);
  const [user, setUser] = useState<{ id: string; name: string | null; editing: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  // Réaffiche les noms quand les villes enregistrées sont chargées.
  useZones();

  // Relancé à chaque retour sur la page (Next conserve l'état) : on repart du profil enregistré.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchMyPreferences()
      .then(({ profile, preferences }) => {
        if (cancelled) return;
        setUser({ id: profile.id, name: profile.username, editing: profile.onboarded });
        setMe(toStudentProfile(profile, preferences));
        const wanted = new URLSearchParams(window.location.search).get("etape");
        const index = profile.onboarded ? STEPS.findIndex((s) => s.id === wanted) : -1;
        setSingle(index >= 0);
        setStep(Math.max(0, index));
        setSaving(false);
        setError(null);
        setGpsMessage(null);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (patch: Partial<StudentProfile>) => setMe((m) => ({ ...m, ...patch }));

  /** La zone principale est toujours suivie ; changer de zone retire l'ancienne. */
  function chooseHome(id: string, position: StudentProfile["position"] = null) {
    setMe((m) => ({
      ...m,
      homeZoneId: id,
      position,
      zoneIds: [id, ...m.zoneIds.filter((z) => z !== id && z !== m.homeZoneId)],
    }));
  }

  async function locate() {
    if (!navigator.geolocation) return setGpsMessage(t("Ton navigateur ne permet pas la localisation."));
    if (!(await ensureLocationConsent(true))) return setGpsMessage(t("Position non partagée : cherche ta ville ci-dessous."));
    setLocating(true);
    setGpsMessage(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        // Arrondi à 3 décimales (~100 m) : assez pour les distances, sans stocker l'adresse exacte.
        const position = {
          lat: Math.round(coords.latitude * 1000) / 1000,
          lng: Math.round(coords.longitude * 1000) / 1000,
        };
        try {
          // Une ville déjà connue autour de soi, sinon la commune où l'on est (position arrondie à ~1 km).
          let zone = zoneAround(position);
          if (!zone) {
            const city = await cityAt(position);
            if (!city) {
              setGpsMessage(t("Aucune ville de France trouvée ici : cherche la tienne ci-dessous."));
              return;
            }
            zone = await ensureZone(city);
          }
          chooseHome(zone.id, position);
          setGpsMessage(t("Trouvé : {name}, à {distance} du centre.", { name: zone.name, distance: formatDistance(distanceKm(position, zone)) }));
        } catch (e) {
          setGpsMessage((e as Error).message);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setGpsMessage(t("Localisation impossible : cherche ta ville ci-dessous."));
      },
      { timeout: 10000 },
    );
  }

  async function finish() {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      // Carte Sortir : seulement autour de Rennes (tâche 54).
      await saveMyPreferences(user.id, carteSortirArea(me) ? me : { ...me, hasCarteSortir: null });
      router.push(single ? "/profil" : "/");
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  const current = STEPS[step];
  /** La question Carte Sortir n'est posée qu'autour de Rennes. */
  const sortir = carteSortirArea(me);
  const others = me.zoneIds.filter((z) => z !== me.homeZoneId);
  const last = step === STEPS.length - 1;
  // Seules la zone et au moins un pôle de dépenses sont indispensables.
  const missing =
    current.id === "zone" ? !me.homeZoneId : current.id === "categories" ? me.categories.length === 0 : false;
  const skippable =
    (current.id === "transport" && me.transportModes.length === 0) ||
    (current.id === "travel" && !me.homeVisits) ||
    (current.id === "aids" && me.isScholar === null && (me.hasCarteSortir === null || !sortir)) ||
    (current.id === "budget" && !me.budget) ||
    (current.id === "activities" && me.activities.length === 0);
  const matches = rankDeals(deals, me).filter((r) => r.match.forYou).length;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 pb-32 pt-4 lg:max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={step === 0 || single}
          aria-label={t("Étape précédente")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted)] disabled:invisible"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--color-border)" }}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%`, backgroundColor: "var(--color-forest)" }}
          />
        </div>
        {user?.editing ? (
          <button
            type="button"
            onClick={() => router.push(single ? "/profil" : "/")}
            aria-label={t("Fermer sans enregistrer")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted)]"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        ) : (
          <span className="w-9" />
        )}
      </div>

      <h1 className="mt-5">{t(current.title)}</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{t(current.subtitle)}</p>

      <div className="mt-5">
        {current.id === "zone" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={locate}
              disabled={locating}
              className="sw-btn-secondary w-full disabled:opacity-50"
            >
              <PinIcon className="h-4 w-4" /> {locating ? t("Recherche…") : t("Me localiser")}
            </button>
            <LocationNotice>
              {t("Facultatif : envoyée chiffrée, arrondie à environ 100 m, enregistrée avec ton profil et lisible par toi seul. Pour trouver ta commune, elle est envoyée à Photon arrondie à environ 1 km. Choisir une ville dans la recherche l'efface.")}
            </LocationNotice>
            {gpsMessage && (
              <p role="status" className="text-sm text-[var(--color-muted)]">
                {gpsMessage}
              </p>
            )}
            {me.homeZoneId && (
              <p className="flex items-center gap-2 rounded-2xl border-2 p-3 font-medium" style={{ borderColor: "var(--color-forest)", backgroundColor: "var(--color-sage)", color: "var(--color-forest)" }}>
                <PinIcon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{zoneById(me.homeZoneId)?.name ?? me.homeZoneId}</span>
                <span className="text-xs font-normal">{t("Ville principale")}</span>
              </p>
            )}
            <CitySearch
              label={me.homeZoneId ? t("Changer de ville") : t("Ta ville ou ton campus")}
              exclude={me.homeZoneId ? [me.homeZoneId] : []}
              // Une seule liste de raccourcis à l'écran : celle des villes à ajouter, une fois la ville choisie.
              suggestions={!me.homeZoneId}
              onChoose={(zone) => chooseHome(zone.id)}
            />
            {me.homeZoneId && (
              <div className="space-y-2 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-sm font-medium">{t("Aussi des bons plans de :")}</p>
                {others.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {others.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => update({ zoneIds: me.zoneIds.filter((z) => z !== id) })}
                        aria-label={t("Retirer {name}", { name: zoneById(id)?.name ?? id })}
                        className="flex items-center gap-1 rounded-full border-2 border-[var(--color-forest)] bg-[var(--color-sage)] px-3 py-1.5 text-sm font-medium text-[var(--color-forest)]"
                      >
                        {zoneById(id)?.name ?? id} <CloseIcon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                )}
                {others.length < MAX_OTHER_ZONES ? (
                  <CitySearch
                    label={t("Ajouter une ville ({n} sur {max})", { n: others.length, max: MAX_OTHER_ZONES })}
                    exclude={me.zoneIds}
                    onChoose={(zone) => !me.zoneIds.includes(zone.id) && update({ zoneIds: [...me.zoneIds, zone.id] })}
                  />
                ) : (
                  <p className="text-xs text-[var(--color-muted)]">{MAX_OTHER_ZONES}{" "}{t("villes au maximum : retires-en une pour en ajouter.")}</p>
                )}
              </div>
            )}
          </div>
        )}

        {current.id === "transport" && (
          <div className="grid grid-cols-3 gap-2">
            {keys<TransportMode>(TRANSPORT_MODES).filter((m) => m !== "plane").map((m) => {
              const { Icon, label } = TRANSPORT_MODES[m];
              return (
                <ChoiceTile
                  key={m}
                  icon={<Icon className="h-7 w-7" />}
                  label={t(label)}
                  selected={me.transportModes.includes(m)}
                  onClick={() => update({ transportModes: toggle(me.transportModes, m) })}
                />
              );
            })}
          </div>
        )}

        {current.id === "travel" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              {keys<HomeVisits>(HOME_VISITS).map((v) => {
                const { Icon, label, hint } = HOME_VISITS[v];
                return (
                  <ChoiceTile
                    key={v}
                    icon={<Icon className="h-7 w-7" />}
                    label={t(label)}
                    hint={t(hint)}
                    selected={me.homeVisits === v}
                    onClick={() => update({ homeVisits: me.homeVisits === v ? null : v })}
                  />
                );
              })}
            </div>
            {isTraveler(me) && (
              <fieldset>
                <legend className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                  <SuitcaseIcon className="h-4 w-4" />{" "}{t("Avec quoi ? (plusieurs choix possibles)")}
                </legend>
                <div className="grid grid-cols-4 gap-2">
                  {TRAVEL_MODES.map((m) => {
                    const { Icon, label } = SUBCATEGORIES[m];
                    return (
                      <ChoiceTile
                        key={m}
                        icon={<Icon className="h-7 w-7" />}
                        label={m === "carpool" ? t("Covoit’") : t(label)}
                        selected={me.travelModes.includes(m)}
                        onClick={() => update({ travelModes: toggle(me.travelModes, m) })}
                      />
                    );
                  })}
                </div>
              </fieldset>
            )}
          </div>
        )}

        {current.id === "budget" && (
          <div className="space-y-3">
            {keys<BudgetProfile>(BUDGET_PROFILES).map((b) => {
              const { Icon, label, hint } = BUDGET_PROFILES[b];
              return (
                <ChoiceTile
                  key={b}
                  row
                  icon={<Icon className="h-7 w-7" />}
                  label={t(label)}
                  hint={t(hint)}
                  selected={me.budget === b}
                  onClick={() => update({ budget: b })}
                />
              );
            })}
          </div>
        )}

        {current.id === "aids" && (
          <div className="space-y-5">
            {(
              [
                { key: "isScholar", question: t("Tu es boursier ?") },
                { key: "hasCarteSortir", question: t("Tu as la Carte Sortir, ou tu y as droit ?") },
              ] as const
            ).filter((q) => q.key !== "hasCarteSortir" || sortir).map(({ key, question }) => (
              <fieldset key={key}>
                <legend className="mb-2 text-sm font-medium">{question}</legend>
                <div className="grid grid-cols-2 gap-2">
                  {[true, false].map((value) => (
                    <ChoiceTile
                      key={String(value)}
                      row
                      icon={value ? <CheckIcon className="h-5 w-5" /> : <CloseIcon className="h-5 w-5" />}
                      label={value ? t("Oui") : t("Non")}
                      selected={me[key] === value}
                      onClick={() => update({ [key]: me[key] === value ? null : value })}
                    />
                  ))}
                </div>
              </fieldset>
            ))}
            {sortir && <p className="text-xs text-[var(--color-muted)]">
              {t("La Carte Sortir est un dispositif de Rennes Métropole, sous conditions de ressources.")}{" "}
              <a href={CARTE_SORTIR_URL} target="_blank" rel="noreferrer" className="underline">
                {t("Se renseigner")}
              </a>
            </p>}
          </div>
        )}

        {current.id === "categories" && (
          <div className="grid grid-cols-2 gap-2">
            {keys<DealCategory>(CATEGORIES).filter((c) => !ELIGIBILITY_CATEGORIES.includes(c)).map((c) => {
              const rank = me.categories.indexOf(c);
              return (
                <ChoiceTile
                  key={c}
                  icon={<CategoryIcon category={c} size={32} />}
                  label={t(CATEGORIES[c].label)}
                  selected={rank >= 0}
                  badge={rank >= 0 && rank < 3 ? rank + 1 : undefined}
                  onClick={() => update({ categories: toggle(me.categories, c) })}
                />
              );
            })}
          </div>
        )}

        {current.id === "activities" && (
          <div className="grid grid-cols-3 gap-2">
            {keys<ActivityId>(ACTIVITIES).map((a) => {
              const { Icon, label } = ACTIVITIES[a];
              return (
                <ChoiceTile
                  key={a}
                  icon={<Icon className="h-7 w-7" />}
                  label={t(label)}
                  selected={me.activities.includes(a)}
                  onClick={() => update({ activities: toggle(me.activities, a) })}
                />
              );
            })}
          </div>
        )}

        {current.id === "recap" && (
          <dl className="sw-card divide-y divide-[var(--color-border)]" style={{ borderWidth: 2 }}>
            {preferenceRows(me).map((row) => (
              <button
                key={row.label}
                type="button"
                onClick={() => setStep(STEPS.findIndex((x) => x.id === row.step))}
                className="flex w-full items-start gap-3 p-3 text-left"
                style={{ borderColor: "var(--color-border)" }}
              >
                <dt className="w-24 shrink-0 text-sm text-[var(--color-muted)]">{t(row.label)}</dt>
                <dd className="flex-1 text-sm font-medium">{row.value ? row.value.split(" · ").map((v) => t(v)).join(" · ") : t("Non renseigné")}</dd>
                <span aria-hidden className="text-[var(--color-muted)]">
                  ›
                </span>
              </button>
            ))}
          </dl>
        )}
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-10 px-4 pb-4 pt-3"
        style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-paper)" }}
      >
        <div className="mx-auto max-w-md lg:max-w-2xl">
          {error && (
            <p role="alert" className="mb-2 text-sm text-red-600">
              {error}{" "}
              {!user && (
                <Link href="/" className="font-semibold underline">
                  {t("Retour à l'accueil")}
                </Link>
              )}
            </p>
          )}
          {matches > 0 && (
            <p
              role="status"
              className="mb-2 flex items-center justify-center gap-1.5 text-center text-sm font-medium"
              style={{ color: "var(--color-forest)" }}
            >
              <TargetIcon className="h-4 w-4 shrink-0" />
              {user?.name && last ? `${user.name}, ` : ""}
              {t(matches > 1 ? "{n} bons plans correspondent à ton profil" : "{n} bon plan correspond à ton profil", { n: matches })}
            </p>
          )}
          <button
            type="button"
            onClick={last || single ? finish : () => setStep(step + 1)}
            disabled={missing || saving || (last && !user)}
            className="sw-btn-primary w-full disabled:opacity-40"
          >
            {saving
              ? t("Enregistrement…")
              : single
                ? t("Enregistrer")
                : last
                  ? t("Voir mes bons plans")
                  : skippable
                    ? t("Passer")
                    : t("Continuer")}
          </button>
        </div>
      </div>
    </div>
  );
}
