// Notifications dans l'application ouverte (tâche 68). Pas d'envoi quand l'appli est fermée (il faudrait un service
// d'envoi). Réglages gardés avec le compte (user_metadata) : ils suivent l'utilisateur d'un appareil à l'autre.
import { useEffect, useState } from "react";
import { announce } from "./arrows";
import { tr } from "./i18n";
import { getSupabase, isSupabaseConfigured } from "./supabase/client";

export interface NotificationSettings {
  /** « Tu es près de… : toujours dispo ? » quand on passe près d'une offre (position partagée). */
  nearby: boolean;
  /** À l'ouverture : « J'en ai profité » reçus par ses offres depuis la dernière visite. */
  confirmations: boolean;
}

const DEFAULTS: NotificationSettings = { nearby: false, confirmations: true };
/** Distance à laquelle « Bons plans à proximité » se déclenche. */
export const NEARBY_ALERT_M = 150;
const EVENT = "sharewood:notification-settings";

export async function fetchNotificationSettings(): Promise<NotificationSettings | null> {
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  if (!user) return null;
  return { ...DEFAULTS, ...(user.user_metadata?.notifications as Partial<NotificationSettings> | undefined) };
}

export async function saveNotificationSettings(settings: NotificationSettings) {
  const { error } = await getSupabase().auth.updateUser({ data: { notifications: settings } });
  if (error) throw new Error(error.message);
  window.dispatchEvent(new Event(EVENT));
}

/** Réglages actuels, tenus à jour ; null tant qu'ils ne sont pas connus (ou sans compte). */
export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    const read = () =>
      fetchNotificationSettings()
        .then((s) => !cancelled && setSettings(s))
        .catch(() => !cancelled && setSettings(null));
    read();
    window.addEventListener(EVENT, read);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, read);
    };
  }, []);
  return settings;
}

/**
 * À l'ouverture de l'appli : annonce les « J'en ai profité » reçus par ses offres depuis la dernière visite,
 * puis note la visite. La première fois, rien n'est annoncé.
 */
export async function announceNewConfirmations() {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const since = user.user_metadata?.notifications_seen_at as string | undefined;
  const now = new Date().toISOString();
  await supabase.auth.updateUser({ data: { notifications_seen_at: now } });
  if (!since) return;
  const { data: mine } = await supabase.from("deals").select("id").eq("author_id", user.id);
  const ids = (mine ?? []).map((d) => d.id as string);
  if (ids.length === 0) return;
  const { count } = await supabase
    .from("votes")
    .select("deal_id", { count: "exact", head: true })
    .in("deal_id", ids)
    .eq("value", 1)
    .neq("user_id", user.id)
    .gt("created_at", since);
  if (!count) return;
  announce({
    title: count > 1 ? tr("{n} étudiants ont confirmé tes offres", { n: count }) : tr("Un étudiant a confirmé ton offre"),
    detail: tr("« J'en ai profité » depuis ta dernière visite."),
  });
}
