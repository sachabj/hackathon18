"use client";

// Parcours « ton profil » : après l'inscription, puis pour modifier ses préférences. Responsable : Sacha.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";
import {
  ArrowLeftIcon,
  BuildingsIcon,
  CloseIcon,
  GlobeIcon,
  GraduationCapIcon,
  HomeIcon,
  PinIcon,
  SmileIcon,
  SuitcaseIcon,
  TargetIcon,
} from "@/components/icons";
import {
  ACTIVITIES,
  BUDGET_PROFILES,
  CATEGORIES,
  HOME_VISITS,
  SUBCATEGORIES,
  TRANSPORT_MODES,
  TRAVEL_MODES,
  ZONES,
} from "@/lib/constants";
import { formatDistance, nearestZone } from "@/lib/geo";
import { isTraveler, rankDeals, toStudentProfile, type StudentProfile } from "@/lib/matching";
import { fetchMyPreferences, saveMyPreferences } from "@/lib/preferences";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { ActivityId, BudgetProfile, DealCategory, HomeVisits, TransportMode } from "@/lib/types";
import { useDeals } from "@/lib/useDeals";
import ChoiceTile from "./ChoiceTile";

/** Au-delà, la position GPS n'est pas gardée : elle rendrait tous les bons plans « trop loin ». */
const MAX_GPS_KM = 20;

const EMPTY: StudentProfile = {
  categories: [],
  zoneIds: [],
  homeZoneId: null,
  position: null,
  transportModes: [],
  budget: null,
  activities: [],
  homeVisits: null,
  wantsTravel: null,
  travelModes: [],
};

const STEPS = [
  { id: "zone", title: "Où es-tu ?", subtitle: "Choisis ta zone principale, là où tu passes le plus de temps." },
  { id: "transport", title: "Au quotidien, tu te déplaces comment ?", subtitle: "Pour ne te proposer que ce qui est à ta portée. Plusieurs choix possibles." },
  { id: "travel", title: "Et les longs trajets ?", subtitle: "Pour repérer les billets et les covoiturages qui te serviront." },
  { id: "budget", title: "Ton budget ?", subtitle: "Visible uniquement par toi." },
  { id: "categories", title: "Tes pôles de dépenses", subtitle: "Touche-les dans l'ordre d'importance : les 3 premiers sont tes priorités." },
  { id: "activities", title: "Qu'est-ce que tu aimes faire ?", subtitle: "On mettra ces sorties en avant." },
  { id: "recap", title: "Ton profil est prêt", subtitle: "Tu pourras le modifier quand tu veux." },
] as const;

const toggle = <T,>(list: T[], item: T) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

const keys = <K extends string>(record: Record<K, unknown>) => Object.keys(record) as K[];

export default function PreferencesWizard() {
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

  function locate() {
    if (!navigator.geolocation) return setGpsMessage("Ton navigateur ne permet pas la localisation.");
    setLocating(true);
    setGpsMessage(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        // Arrondi à 3 décimales (~100 m) : assez pour les distances, sans stocker l'adresse exacte.
        const position = {
          lat: Math.round(coords.latitude * 1000) / 1000,
          lng: Math.round(coords.longitude * 1000) / 1000,
        };
        const { zone, km } = nearestZone(position);
        setLocating(false);
        if (km > MAX_GPS_KM) {
          return setGpsMessage(
            `Tu es à ${formatDistance(km)} de nos zones : choisis la tienne ci-dessous.`,
          );
        }
        chooseHome(zone.id, position);
        setGpsMessage(`Trouvé : tu es à ${formatDistance(km)} du centre de ${zone.name}.`);
      },
      () => {
        setLocating(false);
        setGpsMessage("Localisation impossible : choisis ta zone ci-dessous.");
      },
      { timeout: 10000 },
    );
  }

  async function finish() {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await saveMyPreferences(user.id, me);
      router.push(single ? "/profil" : "/");
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  const current = STEPS[step];
  const last = step === STEPS.length - 1;
  // Seules la zone et au moins un pôle de dépenses sont indispensables.
  const missing =
    current.id === "zone" ? !me.homeZoneId : current.id === "categories" ? me.categories.length === 0 : false;
  const skippable =
    (current.id === "transport" && me.transportModes.length === 0) ||
    (current.id === "travel" && !me.homeVisits && me.wantsTravel === null) ||
    (current.id === "budget" && !me.budget) ||
    (current.id === "activities" && me.activities.length === 0);
  const matches = rankDeals(deals, me).filter((r) => r.match.forYou).length;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 pb-32 pt-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={step === 0 || single}
          aria-label="Étape précédente"
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
            aria-label="Fermer sans enregistrer"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted)]"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        ) : (
          <span className="w-9" />
        )}
      </div>

      <h1 className="mt-5">{current.title}</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{current.subtitle}</p>

      <div className="mt-5">
        {current.id === "zone" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={locate}
              disabled={locating}
              className="sw-btn-secondary w-full disabled:opacity-50"
            >
              <PinIcon className="h-4 w-4" /> {locating ? "Recherche…" : "Me localiser"}
            </button>
            <p className="text-center text-xs text-[var(--color-muted)]">
              Facultatif : ta position est arrondie (~100 m), enregistrée avec ton profil et visible par toi seul.
              Toucher une zone à la main l&apos;efface.
            </p>
            {gpsMessage && (
              <p role="status" className="text-sm text-[var(--color-muted)]">
                {gpsMessage}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {ZONES.map((z) => (
                <ChoiceTile
                  key={z.id}
                  icon={
                    z.id === "rennes" ? (
                      <BuildingsIcon className="h-7 w-7" />
                    ) : z.id === "ker-lann" ? (
                      <GraduationCapIcon className="h-7 w-7" />
                    ) : (
                      <HomeIcon className="h-7 w-7" />
                    )
                  }
                  label={z.name}
                  selected={me.homeZoneId === z.id}
                  onClick={() => chooseHome(z.id)}
                />
              ))}
            </div>
            {me.homeZoneId && (
              <div>
                <p className="text-sm font-medium">Aussi des bons plans de :</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ZONES.filter((z) => z.id !== me.homeZoneId).map((z) => {
                    const on = me.zoneIds.includes(z.id);
                    return (
                      <button
                        key={z.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => update({ zoneIds: toggle(me.zoneIds, z.id) })}
                        className={`rounded-full border-2 px-4 py-1.5 text-sm font-medium ${on ? "border-[var(--color-forest)] bg-[var(--color-sage)] text-[var(--color-forest)]" : ""}`}
                        style={on ? undefined : { borderColor: "var(--color-border)" }}
                      >
                        {z.name}
                      </button>
                    );
                  })}
                </div>
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
                  label={label}
                  selected={me.transportModes.includes(m)}
                  onClick={() => update({ transportModes: toggle(me.transportModes, m) })}
                />
              );
            })}
          </div>
        )}

        {current.id === "travel" && (
          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <HomeIcon className="h-4 w-4" /> Tu rentres chez tes parents ?
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {keys<HomeVisits>(HOME_VISITS).map((v) => {
                  const { Icon, label, hint } = HOME_VISITS[v];
                  return (
                    <ChoiceTile
                      key={v}
                      icon={<Icon className="h-7 w-7" />}
                      label={label}
                      hint={hint}
                      selected={me.homeVisits === v}
                      onClick={() => update({ homeVisits: me.homeVisits === v ? null : v })}
                    />
                  );
                })}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <SuitcaseIcon className="h-4 w-4" /> Envie de voyager de temps en temps ?
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: true, icon: <GlobeIcon className="h-7 w-7" />, label: "Oui, ça me tente" },
                  { value: false, icon: <SmileIcon className="h-7 w-7" />, label: "Pas pour l'instant" },
                ].map(({ value, ...tile }) => (
                  <ChoiceTile
                    key={tile.label}
                    {...tile}
                    selected={me.wantsTravel === value}
                    onClick={() => update({ wantsTravel: me.wantsTravel === value ? null : value })}
                  />
                ))}
              </div>
            </fieldset>
            {isTraveler(me) && (
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Avec quoi ? (plusieurs choix possibles)</legend>
                <div className="grid grid-cols-4 gap-2">
                  {TRAVEL_MODES.map((m) => {
                    const { Icon, label } = SUBCATEGORIES[m];
                    return (
                      <ChoiceTile
                        key={m}
                        icon={<Icon className="h-7 w-7" />}
                        label={m === "carpool" ? "Covoit’" : label}
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
                  label={label}
                  hint={hint}
                  selected={me.budget === b}
                  onClick={() => update({ budget: b })}
                />
              );
            })}
          </div>
        )}

        {current.id === "categories" && (
          <div className="grid grid-cols-2 gap-2">
            {keys<DealCategory>(CATEGORIES).map((c) => {
              const rank = me.categories.indexOf(c);
              return (
                <ChoiceTile
                  key={c}
                  icon={<CategoryIcon category={c} size={32} />}
                  label={CATEGORIES[c].label}
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
                  label={label}
                  selected={me.activities.includes(a)}
                  onClick={() => update({ activities: toggle(me.activities, a) })}
                />
              );
            })}
          </div>
        )}

        {current.id === "recap" && (
          <dl className="sw-card divide-y divide-[var(--color-border)]" style={{ borderWidth: 2 }}>
            {[
              {
                label: "Zones",
                value: ZONES.filter((z) => me.zoneIds.includes(z.id))
                  .map((z) => (z.id === me.homeZoneId ? `${z.name} (principale)` : z.name))
                  .join(" · "),
              },
              {
                label: "Quotidien",
                value: me.transportModes.map((m) => TRANSPORT_MODES[m].label).join(" · "),
              },
              {
                label: "Voyages",
                value: [
                  me.homeVisits && `Chez les parents : ${HOME_VISITS[me.homeVisits].label.toLowerCase()}`,
                  me.wantsTravel !== null && (me.wantsTravel ? "Envie de voyager" : "Pas de voyage prévu"),
                  isTraveler(me) && me.travelModes.map((m) => SUBCATEGORIES[m].label).join(", "),
                ]
                  .filter(Boolean)
                  .join(" · "),
              },
              {
                label: "Budget",
                value: me.budget ? BUDGET_PROFILES[me.budget].label : "",
              },
              {
                label: "Priorités",
                value: me.categories.map((c) => CATEGORIES[c].label).join(" · "),
              },
              {
                label: "Activités",
                value: me.activities.map((a) => ACTIVITIES[a].label).join(" · "),
              },
            ].map((row, i) => (
              <button
                key={row.label}
                type="button"
                onClick={() => setStep(i)}
                className="flex w-full items-start gap-3 p-3 text-left"
                style={{ borderColor: "var(--color-border)" }}
              >
                <dt className="w-24 shrink-0 text-sm text-[var(--color-muted)]">{row.label}</dt>
                <dd className="flex-1 text-sm font-medium">{row.value || "Non renseigné"}</dd>
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
        <div className="mx-auto max-w-md">
          {error && (
            <p role="alert" className="mb-2 text-sm text-red-600">
              {error}{" "}
              {!user && (
                <Link href="/" className="font-semibold underline">
                  Retour à l&apos;accueil
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
              {matches} bon{matches > 1 ? "s" : ""} plan{matches > 1 ? "s" : ""} correspond
              {matches > 1 ? "ent" : ""} à ton profil
            </p>
          )}
          <button
            type="button"
            onClick={last || single ? finish : () => setStep(step + 1)}
            disabled={missing || saving || (last && !user)}
            className="sw-btn-primary w-full disabled:opacity-40"
          >
            {saving
              ? "Enregistrement…"
              : single
                ? "Enregistrer"
                : last
                  ? "Voir mes bons plans"
                  : skippable
                    ? "Passer"
                    : "Continuer"}
          </button>
        </div>
      </div>
    </div>
  );
}
