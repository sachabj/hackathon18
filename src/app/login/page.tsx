"use client";

import { useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
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
        : await supabase.auth.signUp({ email, password, options: { data: { username } } });
    setLoading(false);
    if (error) return setError(error.message);
    // Après inscription → choix des préférences ; après connexion → carte.
    window.location.href = mode === "signup" ? "/onboarding" : "/";
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <h1 className="text-4xl font-bold text-blue-600">{APP_NAME}</h1>
      <p className="mt-2 text-zinc-500 text-center">Le Waze des bons plans étudiants</p>

      <form onSubmit={submit} className="mt-8 w-full max-w-sm space-y-3">
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
