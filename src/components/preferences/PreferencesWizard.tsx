"use client";

// Parcours « ton profil » : après l'inscription, puis pour modifier ses préférences. Responsable : Sacha.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ACTIVITIES, BUDGET_PROFILES, CATEGORIES, TRANSPORT_MODES, ZONES } from "@/lib/constants";
import { formatDistance, nearestZone } from "@/lib/geo";
import { rankDeals, type StudentProfile } from "@/lib/matching";
import { fetchMyPreferences, saveMyPreferences } from "@/lib/preferences";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { ActivityId, BudgetProfile, DealCategory, TransportMode } from "@/lib/types";
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
};

const STEPS = [
  { id: "zone", title: "Où es-tu ?", subtitle: "Choisis ta zone principale, là où tu passes le plus de temps." },
  { id: "transport", title: "Comment tu te déplaces ?", subtitle: "Pour ne te proposer que ce qui est à ta portée. Plusieurs choix possibles." },
  { id: "budget", title: "Ton budget ?", subtitle: "Visible uniquement par toi." },
  { id: "categories", title: "Tes pôles de dépenses", subtitle: "Touche-les dans l'ordre d'importance : les 3 premiers sont tes priorités." },
  { id: "activities", title: "Qu'est-ce que tu aimes faire ?", subtitle: "On mettra ces sorties en avant." },
  { id: "recap", title: "Ton profil est prêt 🎉", subtitle: "Tu pourras le modifier quand tu veux." },
] as const;

const toggle = <T,>(list: T[], item: T) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

const keys = <K extends string>(record: Record<K, unknown>) => Object.keys(record) as K[];

export default function PreferencesWizard() {
  const router = useRouter();
  const { deals } = useDeals();
  const [step, setStep] = useState(0);
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
        setMe({
          categories: profile.followed_categories,
          zoneIds: profile.followed_zone_ids,
          homeZoneId: preferences?.home_zone_id ?? null,
          position:
            preferences?.lat != null && preferences.lng != null
              ? { lat: preferences.lat, lng: preferences.lng }
              : null,
          transportModes: preferences?.transport_modes ?? [],
          budget: preferences?.budget_profile ?? null,
          activities: preferences?.activities ?? [],
        });
        setStep(0);
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
        setGpsMessage(`📍 Trouvé : tu es à ${formatDistance(km)} du centre de ${zone.name}.`);
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
      router.push("/");
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
    (current.id === "budget" && !me.budget) ||
    (current.id === "activities" && me.activities.length === 0);
  const matches = rankDeals(deals, me).filter((r) => r.match.forYou).length;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 pb-32 pt-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          aria-label="Étape précédente"
          className="h-9 w-9 rounded-full text-xl text-zinc-600 disabled:invisible"
        >
          ←
        </button>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        {user?.editing ? (
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Fermer sans enregistrer"
            className="h-9 w-9 rounded-full text-xl text-zinc-600"
          >
            ✕
          </button>
        ) : (
          <span className="w-9" />
        )}
      </div>

      <h1 className="mt-5 text-2xl font-bold">{current.title}</h1>
      <p className="mt-1 text-sm text-zinc-500">{current.subtitle}</p>

      <div className="mt-5">
        {current.id === "zone" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={locate}
              disabled={locating}
              className="w-full rounded-2xl bg-blue-50 py-3 font-semibold text-blue-700 disabled:opacity-50"
            >
              {locating ? "Recherche…" : "📍 Me localiser"}
            </button>
            <p className="text-center text-xs text-zinc-500">
              Facultatif : ta position est arrondie (~100 m), enregistrée avec ton profil et visible par toi seul.
              Toucher une zone à la main l&apos;efface.
            </p>
            {gpsMessage && (
              <p role="status" className="text-sm text-zinc-600">
                {gpsMessage}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {ZONES.map((z) => (
                <ChoiceTile
                  key={z.id}
                  emoji={z.id === "rennes" ? "🏙️" : z.id === "ker-lann" ? "🎓" : "🏡"}
                  label={z.name}
                  selected={me.homeZoneId === z.id}
                  onClick={() => chooseHome(z.id)}
                />
              ))}
            </div>
            {me.homeZoneId && (
              <div>
                <p className="text-sm font-semibold">Aussi des bons plans de :</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ZONES.filter((z) => z.id !== me.homeZoneId).map((z) => {
                    const on = me.zoneIds.includes(z.id);
                    return (
                      <button
                        key={z.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => update({ zoneIds: toggle(me.zoneIds, z.id) })}
                        className={`rounded-full border-2 px-4 py-1.5 text-sm font-medium ${on ? "border-blue-600 bg-blue-50 text-blue-700" : "border-zinc-200"}`}
                      >
                        {on ? "✓" : "+"} {z.name}
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
            {keys<TransportMode>(TRANSPORT_MODES).map((m) => (
              <ChoiceTile
                key={m}
                emoji={TRANSPORT_MODES[m].emoji}
                label={TRANSPORT_MODES[m].label}
                selected={me.transportModes.includes(m)}
                onClick={() => update({ transportModes: toggle(me.transportModes, m) })}
              />
            ))}
          </div>
        )}

        {current.id === "budget" && (
          <div className="space-y-3">
            {keys<BudgetProfile>(BUDGET_PROFILES).map((b) => (
              <ChoiceTile
                key={b}
                row
                {...BUDGET_PROFILES[b]}
                selected={me.budget === b}
                onClick={() => update({ budget: b })}
              />
            ))}
          </div>
        )}

        {current.id === "categories" && (
          <div className="grid grid-cols-2 gap-2">
            {keys<DealCategory>(CATEGORIES).map((c) => {
              const rank = me.categories.indexOf(c);
              return (
                <ChoiceTile
                  key={c}
                  emoji={CATEGORIES[c].emoji}
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
            {keys<ActivityId>(ACTIVITIES).map((a) => (
              <ChoiceTile
                key={a}
                {...ACTIVITIES[a]}
                selected={me.activities.includes(a)}
                onClick={() => update({ activities: toggle(me.activities, a) })}
              />
            ))}
          </div>
        )}

        {current.id === "recap" && (
          <dl className="divide-y divide-zinc-100 rounded-2xl border-2 border-zinc-200">
            {[
              {
                label: "Zones",
                value: ZONES.filter((z) => me.zoneIds.includes(z.id))
                  .map((z) => (z.id === me.homeZoneId ? `🏠 ${z.name}` : z.name))
                  .join(" · "),
              },
              {
                label: "Transports",
                value: me.transportModes.map((m) => `${TRANSPORT_MODES[m].emoji} ${TRANSPORT_MODES[m].label}`).join(" · "),
              },
              {
                label: "Budget",
                value: me.budget ? `${BUDGET_PROFILES[me.budget].emoji} ${BUDGET_PROFILES[me.budget].label}` : "",
              },
              {
                label: "Priorités",
                value: me.categories.map((c) => `${CATEGORIES[c].emoji} ${CATEGORIES[c].label}`).join(" · "),
              },
              {
                label: "Activités",
                value: me.activities.map((a) => `${ACTIVITIES[a].emoji} ${ACTIVITIES[a].label}`).join(" · "),
              },
            ].map((row, i) => (
              <button
                key={row.label}
                type="button"
                onClick={() => setStep(i)}
                className="flex w-full items-start gap-3 p-3 text-left"
              >
                <dt className="w-24 shrink-0 text-sm text-zinc-500">{row.label}</dt>
                <dd className="flex-1 text-sm font-medium">{row.value || "Non renseigné"}</dd>
                <span aria-hidden className="text-zinc-400">
                  ›
                </span>
              </button>
            ))}
          </dl>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-black/10 bg-white px-4 pb-4 pt-3">
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
            <p role="status" className="mb-2 text-center text-sm font-medium text-blue-700">
              🎯 {user?.name && last ? `${user.name}, ` : ""}
              {matches} bon{matches > 1 ? "s" : ""} plan{matches > 1 ? "s" : ""} correspond
              {matches > 1 ? "ent" : ""} à ton profil
            </p>
          )}
          <button
            type="button"
            onClick={last ? finish : () => setStep(step + 1)}
            disabled={missing || saving || (last && !user)}
            className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-40"
          >
            {last ? (saving ? "Enregistrement…" : "Voir mes bons plans") : skippable ? "Passer" : "Continuer"}
          </button>
        </div>
      </div>
    </div>
  );
}
