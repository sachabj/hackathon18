"use client";

import { useState } from "react";
import { LogoutIcon } from "@/components/icons";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

/** Déconnecte ce navigateur (pas les autres appareils) et revient à l'écran de connexion. */
export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setLoading(true);
    setError(null);
    const { error } = await getSupabase().auth.signOut({ scope: "local" });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Rechargement complet : aucune page conservée en mémoire ne doit garder les données du compte.
    window.location.href = "/login";
  }

  return (
    <div>
      <button
        type="button"
        onClick={logout}
        disabled={loading || !isSupabaseConfigured}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-red-200 py-3 font-medium text-red-600 disabled:opacity-50"
      >
        {loading ? "Déconnexion…" : (
          <>
            <LogoutIcon className="h-4 w-4" /> Se déconnecter
          </>
        )}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
