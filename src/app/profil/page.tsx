"use client";

// Profil étudiant (Justin, Sacha) : identité, étudiants aidés, parrainage, puis menu des réglages.
// Mes bons plans, favoris et récompenses sont dans « Ciblés ».
import Link from "next/link";
import { useEffect, useLayoutEffect, useState } from "react";
import DataSection from "@/components/account/DataSection";
import DeleteSection from "@/components/account/DeleteSection";
import SecuritySection from "@/components/account/SecuritySection";
import LocationSetting from "@/components/location/LocationSetting";
import LogoutButton from "@/components/LogoutButton";
import { BellIcon, HistoryIcon, LockClosedIcon, PinIcon, ShieldIcon, SlidersIcon, TargetIcon, TicketIcon, UserIcon, HelpIcon } from "@/components/icons";
import HelpPanel from "@/components/profile/HelpPanel";
import ImpactCard from "@/components/profile/ImpactCard";
import NotificationsPanel from "@/components/profile/NotificationsPanel";
import PersonalInfo from "@/components/profile/PersonalInfo";
import PreferencesSummary from "@/components/profile/PreferencesSummary";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ReferralCard from "@/components/profile/ReferralCard";
import SimulateVisit from "@/components/profile/SimulateVisit";
import { MenuGroup, MenuLink, MenuSection } from "@/components/profile/SettingsMenu";
import { fetchAccountInfo } from "@/lib/account";
import { ZONES } from "@/lib/constants";
import { toStudentProfile } from "@/lib/matching";
import { fetchMyPreferences } from "@/lib/preferences";
import { isSupabaseConfigured } from "@/lib/supabase/client";

type Account = Awaited<ReturnType<typeof fetchMyPreferences>> & { info: Awaited<ReturnType<typeof fetchAccountInfo>> };
type SectionId = "preferences" | "infos" | "securite" | "donnees" | "notifications" | "aide" | "simulation";

export default function Page() {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Relit le profil (informations modifiées, ou position effacée au retrait de la localisation). */
  const [version, setVersion] = useState(0);
  const [open, setOpen] = useState<SectionId | null>(null);
  // Next conserve la page quittée : on referme les sections (et leurs champs, mots de passe compris).
  useLayoutEffect(() => () => setOpen(null), []);

  // Relu à chaque retour sur la page.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    Promise.all([fetchMyPreferences(), fetchAccountInfo()])
      .then(([preferences, info]) => {
        if (cancelled) return;
        setAccount({ ...preferences, info });
        setError(null);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = () => setVersion((v) => v + 1);

  /** Le crayon de l'en-tête mène aux informations personnelles. */
  function editInfos() {
    setOpen("infos");
    requestAnimationFrame(() => document.getElementById("reglage-infos")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const section = { open, onToggle: setOpen };

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6 lg:max-w-2xl">
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {!account && !error && <p className="text-sm text-[var(--color-muted)]">Chargement…</p>}

      {account && (
        <>
          <ProfileHeader
            username={account.profile.username}
            createdAt={account.profile.created_at}
            homeZoneId={account.preferences?.home_zone_id ?? null}
            onEdit={editInfos}
          />
          <ImpactCard />
          <ReferralCard />

          <MenuGroup title="Mes préférences">
            <MenuSection id="preferences" {...section} Icon={SlidersIcon} title="Mes préférences de bons plans" hint="Zones, transports, budget, catégories favorites">
              {account.profile.onboarded ? (
                <PreferencesSummary me={toStudentProfile(account.profile, account.preferences)} />
              ) : (
                <Link href="/onboarding" className="sw-btn-primary w-full">
                  <TargetIcon className="h-4 w-4" /> Personnaliser mes bons plans
                </Link>
              )}
            </MenuSection>
            <MenuLink href="/favoris?onglet=recompenses" Icon={TicketIcon} title="Mes récompenses et bons actifs" hint="QR codes et bons débloqués" />
            <MenuLink href="/favoris?onglet=activite" Icon={HistoryIcon} title="Historique de mes offres et votes" hint="Mes bons plans et mes Flèches" />
          </MenuGroup>

          <MenuGroup title="Compte et sécurité">
            <MenuSection id="infos" {...section} Icon={UserIcon} title="Informations personnelles" hint="Pseudo, email, école, ville">
              <PersonalInfo
                // Les champs repartent des valeurs enregistrées après une relecture.
                key={`${account.info.username}|${account.preferences?.school ?? ""}`}
                userId={account.info.userId}
                username={account.info.username}
                email={account.info.email}
                school={account.preferences?.school ?? ""}
                city={ZONES.find((z) => z.id === account.preferences?.home_zone_id)?.name ?? null}
                onSaved={reload}
              />
            </MenuSection>
            <MenuSection id="securite" {...section} Icon={LockClosedIcon} title="Sécurité et connexion" hint="Mot de passe, appareils connectés">
              <SecuritySection email={account.info.email} />
            </MenuSection>
            <MenuSection id="donnees" {...section} Icon={ShieldIcon} title="Confidentialité et données" hint="Localisation, mes données, suppression du compte">
              <LocationSetting onChange={reload} />
              <DataSection key={String(account.info.hasPosition)} {...account.info} showUsername={false} />
              <DeleteSection />
            </MenuSection>
          </MenuGroup>

          <MenuGroup title="Démonstration">
            <MenuSection id="simulation" {...section} Icon={PinIcon} title="Simuler ma position" hint="Recevoir la notification « toujours dispo ? » devant une offre">
              <SimulateVisit />
            </MenuSection>
          </MenuGroup>

          <MenuGroup title="Support">
            <MenuSection id="notifications" {...section} Icon={BellIcon} title="Notifications" hint="Bientôt disponible">
              <NotificationsPanel />
            </MenuSection>
            <MenuSection id="aide" {...section} Icon={HelpIcon} title="Aide et signaler un bug" hint="Questions fréquentes, écrire à l'équipe">
              <HelpPanel />
            </MenuSection>
          </MenuGroup>
        </>
      )}

      {/* Toujours accessible, même si le profil ne se charge pas. */}
      <LogoutButton />
    </div>
  );
}
