"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GraduationCapIcon, StoreIcon } from "@/components/icons";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { checkReferralCode, REFERRAL } from "@/lib/community";
import { APP_NAME, PASSWORD_MIN } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import LangSwitch from "@/components/LangSwitch";

export default function LoginPage() {
  const t = useT();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [merchant, setMerchant] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Compte créé mais adresse à confirmer. */
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [referral, setReferral] = useState("");
  /** Lien d'offre partagé à rouvrir après la connexion. */
  const [next, setNext] = useState("/");

  // Lien de parrainage (`?parrain=`) : inscription avec le code déjà rempli.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("parrain");
    const suite = params.get("suite");
    /* eslint-disable react-hooks/set-state-in-effect -- lu dans l'adresse après le montage (page statique) */
    if (code) {
      setReferral(code.slice(0, 20).toUpperCase());
      setMode("signup");
    }
    // Seulement une adresse interne connue : pas de redirection vers un autre site.
    if (suite?.startsWith("/offre?")) setNext(suite);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return setError(t("Supabase n'est pas encore configuré."));
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = getSupabase();
    const code = mode === "signup" && !merchant ? referral.trim().toUpperCase() : "";
    if (code) {
      let known: boolean | null;
      try {
        known = await checkReferralCode(code);
      } catch (err) {
        setLoading(false);
        return setError((err as Error).message);
      }
      if (known === false) {
        setLoading(false);
        return setError(t("Code parrainage inconnu : vérifie-le ou laisse le champ vide."));
      }
    }
    const { data, error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username,
                account_type: merchant ? "merchant" : "student",
                privacy_accepted: accepted,
                ...(code && { referral_code: code }),
              },
            },
          });
    setLoading(false);
    if (error) return setError(error.message);
    // Confirmation par email activée : pas encore de session, on l'explique au lieu de rediriger.
    if (!data.session) {
      setMode("login");
      setPassword("");
      return setInfo(t("Compte créé : ouvre l'email de confirmation que tu viens de recevoir, puis connecte-toi."));
    }
    // Après inscription → préférences (étudiant) ou commerce ; après connexion → carte.
    window.location.href = mode === "login" ? next : merchant ? "/commercant" : "/onboarding";
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="absolute right-4 top-4">
        <LangSwitch />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- petit logo statique, SVG */}
      <img src="/logo.svg" alt="" width={56} height={56} aria-hidden />
      <h1 className="mt-3 text-3xl" style={{ color: "var(--color-ink)" }}>{APP_NAME}</h1>
      <p className="sw-quote mt-2 text-center text-[var(--color-muted)]">{t("Les bons plans se partagent.")}</p>

      <form onSubmit={submit} className="mt-8 w-full max-w-sm space-y-3">
        {mode === "signup" && (
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="sr-only">{t("Type de compte")}</legend>
            {[
              { value: false, label: "Étudiant", Icon: GraduationCapIcon },
              { value: true, label: "Commerçant", Icon: StoreIcon },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                aria-pressed={merchant === opt.value}
                onClick={() => setMerchant(opt.value)}
                className="flex items-center justify-center gap-1.5 rounded-lg border-2 py-2 text-sm font-medium"
                style={
                  merchant === opt.value
                    ? { borderColor: "var(--color-forest)", backgroundColor: "var(--color-sage)", color: "var(--color-forest)" }
                    : { borderColor: "var(--color-border)", color: "var(--color-muted)" }
                }
              >
                <opt.Icon className="h-4 w-4" /> {t(opt.label)}
              </button>
            ))}
          </fieldset>
        )}
        {mode === "signup" && (
          <input
            className="sw-field"
            placeholder={t("Pseudo")}
            maxLength={40}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}
        <input
          className="sw-field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="sw-field"
          type="password"
          placeholder={mode === "signup" ? t("Mot de passe (8 caractères min.)") : t("Mot de passe")}
          minLength={mode === "signup" ? PASSWORD_MIN : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {mode === "signup" && !merchant && (
          <label className="block text-sm text-[var(--color-muted)]">
            {t("Code parrainage (facultatif) : +{n} Flèches à ta première action", { n: REFERRAL.referee })}
            <input
              className="sw-field mt-1 uppercase"
              placeholder="WOOD-ALEX26"
              maxLength={20}
              autoCapitalize="characters"
              autoComplete="off"
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
            />
          </label>
        )}
        {mode === "signup" && (
          <label className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              required
            />
            <span>
              {t("J'ai au moins 15 ans et j'accepte la")}{" "}
              <Link href="/confidentialite" target="_blank" className="underline" style={{ color: "var(--color-forest)" }}>
                {t("politique de confidentialité")}
              </Link>
              .
            </span>
          </label>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && (
          <p role="status" className="text-sm font-medium" style={{ color: "var(--color-forest)" }}>
            {info}
          </p>
        )}
        <button disabled={loading} className="sw-btn-primary disabled:opacity-50">
          {loading ? "…" : mode === "login" ? t("Se connecter") : t("Créer mon compte")}
        </button>
      </form>

      <button
        className="mt-4 text-sm font-medium"
        style={{ color: "var(--color-forest)" }}
        onClick={() => {
          setInfo(null);
          setMode(mode === "login" ? "signup" : "login");
        }}
      >
        {mode === "login" ? t("Pas de compte ? S'inscrire") : t("Déjà un compte ? Se connecter")}
      </button>
    </div>
  );
}
