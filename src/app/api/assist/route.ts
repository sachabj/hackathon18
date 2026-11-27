// POST /api/assist — assistant IA du formulaire de publication. Responsable : Matteo.
// { action: "extract", text?, image? }      → brouillon structuré (AssistDraft)
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { AssistError, extractDeal, GeminiHttpError, isAssistConfigured } from "@/lib/ai/assist";
import type { AssistRequest, AssistResponse } from "@/lib/ai/types";

const MAX_TEXT = 4000;
const MAX_IMAGE_BASE64 = 4_000_000; // ~3 Mo d'image, sous la limite de 4,5 Mo des requêtes Vercel
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const fail = (error: string, status: number, unavailable = false) =>
  Response.json({ ok: false, error, unavailable } satisfies AssistResponse<never>, { status });

/** Seuls les utilisateurs connectés peuvent consommer l'API (elle coûte des crédits). */
async function isLoggedIn(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  const supabase = createServerClient(url, key, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
  });
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}

export async function POST(request: NextRequest) {
  if (!isAssistConfigured())
    return fail("Assistant IA non configuré (clé GEMINI_API_KEY ou ANTHROPIC_API_KEY absente).", 503, true);
  if (!(await isLoggedIn(request))) return fail("Connexion requise.", 401);

  let body: AssistRequest;
  try {
    body = await request.json();
  } catch {
    return fail("Requête invalide.", 400);
  }

  try {
    if (body.action === "extract") {
      const text = body.text?.trim().slice(0, MAX_TEXT) || undefined;
      const image = body.image;
      if (!text && !image) return fail("Ajoute une photo ou un texte.", 400);
      if (image && (!IMAGE_TYPES.includes(image.media_type) || typeof image.data !== "string" || image.data.length > MAX_IMAGE_BASE64))
        return fail("Photo trop lourde ou format non pris en charge.", 400);
      const result = await extractDeal({ text, image });
      return Response.json({ ok: true, result } satisfies AssistResponse<typeof result>);
    }
    return fail("Action inconnue.", 400);
  } catch (e) {
    if (e instanceof AssistError) return fail(e.message, 422);
    if (e instanceof GeminiHttpError) {
      console.error("api/assist gemini", e.status, e.message);
      if (e.status === 429) return fail("Assistant très demandé (quota gratuit atteint), réessaie dans un instant.", 429, true);
      if (e.status === 400 || e.status === 401 || e.status === 403) return fail("Clé ou modèle Gemini invalide.", 503, true);
      if (e.status === 404) return fail("Modèle Gemini introuvable (variable GEMINI_MODEL).", 503, true);
      return fail(`Assistant indisponible (${e.status || "réseau"}).`, 502, true);
    }
    if (e instanceof Anthropic.RateLimitError) return fail("Assistant très demandé, réessaie dans un instant.", 429, true);
    if (e instanceof Anthropic.AuthenticationError) return fail("Clé de l'assistant IA invalide.", 503, true);
    if (e instanceof Anthropic.APIError) return fail(`Assistant indisponible (${e.status ?? "réseau"}).`, 502, true);
    console.error("api/assist", e);
    return fail("Erreur de l'assistant.", 500, true);
  }
}
