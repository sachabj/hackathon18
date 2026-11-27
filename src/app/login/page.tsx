"use client";

import { useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [merchant, setMerchant] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return setError("Supabase n'est pas encore configuré.");
    setLoading(true);
    setError(null);
    const supabase = getSupabase();
    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { username, account_type: merchant ? "merchant" : "student" } },
          });
    setLoading(false);
    if (error) return setError(error.message);
    // Après inscription → préférences (étudiant) ou commerce ; après connexion → carte.
    window.location.href = mode === "login" ? "/" : merchant ? "/commercant" : "/onboarding";
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <h1 className="text-4xl font-bold text-blue-600">{APP_NAME}</h1>
      <p className="mt-2 text-zinc-500 text-center">Le Waze des bons plans étudiants</p>

      <form onSubmit={submit} className="mt-8 w-full max-w-sm space-y-3">
        {mode === "signup" && (
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="sr-only">Type de compte</legend>
            {[
              { value: false, label: "🎓 Étudiant" },
              { value: true, label: "🏪 Commerçant" },
            ].map((t) => (
              <button
                key={t.label}
                type="button"
                aria-pressed={merchant === t.value}
                onClick={() => setMerchant(t.value)}
                className={`rounded-lg border-2 py-2 text-sm font-semibold ${merchant === t.value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-zinc-200 text-zinc-600"}`}
              >
                {t.label}
              </button>
            ))}
          </fieldset>
        )}
        {mode === "signup" && (
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Pseudo"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}
        <input
          className="w-full rounded-lg border px-3 py-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border px-3 py-2"
          type="password"
          placeholder="Mot de passe (6 caractères min.)"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>

      <button
        className="mt-4 text-sm text-blue-600"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login" ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
      </button>
    </div>
  );
}
