import { WarningIcon } from "@/components/icons";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function SupabaseBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 bg-amber-100 text-amber-900 text-sm px-4 py-2 text-center">
      <WarningIcon className="h-4 w-4 shrink-0" /> Supabase n&apos;est pas configuré : copie <code>.env.example</code> en <code>.env.local</code> et remplis les clés.
    </div>
  );
}
