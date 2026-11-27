"use client";

// « ✨ Pré-remplir avec l'IA » : photo d'une affiche et/ou texte libre → brouillon du formulaire.
// Responsable : Matteo.
import Link from "next/link";
import { useState } from "react";
import { AssistUnavailable, extractFromInput, photoToJpeg } from "@/lib/ai/client";
import type { AssistDraft } from "@/lib/ai/types";

type Photo = Awaited<ReturnType<typeof photoToJpeg>>;

/** `photo` : la photo analysée (gardée comme preuve du bon plan), ou null si seul un texte a été analysé. */
export default function AssistPanel({
  onDraft,
}: {
  onDraft: (draft: AssistDraft, photo: { data: string; preview: string } | null) => void;
}) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [showText, setShowText] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    try {
      setPhoto(await photoToJpeg(file));
    } catch {
      setMessage({ tone: "error", text: "Impossible de lire cette photo." });
    }
  }

  async function analyse() {
    if (!photo && !text.trim()) return setMessage({ tone: "error", text: "Ajoute une photo ou un texte." });
    setBusy(true);
    setMessage(null);
    try {
      const draft = await extractFromInput({
        text: text.trim() || undefined,
        image: photo ? { media_type: photo.media_type, data: photo.data } : undefined,
      });
      onDraft(draft, photo ? { data: photo.data, preview: photo.preview } : null);
      const check = draft.confidence === "basse" ? "Lecture difficile : vérifie bien chaque champ." : "Vérifie les champs pré-remplis avant de publier.";
      setMessage({ tone: draft.confidence === "basse" ? "warn" : "ok", text: [check, draft.notes].filter(Boolean).join(" ") });
    } catch (e) {
      setMessage({
        tone: "error",
        text: e instanceof AssistUnavailable ? `${e.message} Remplis le formulaire à la main.` : (e as Error).message,
      });
    } finally {
      setBusy(false);
    }
  }

  const tone = { ok: "text-emerald-700", warn: "text-amber-700", error: "text-red-600" };

  return (
    <section className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/60 p-3">
      <div>
        <h2 className="font-semibold text-zinc-900">✨ Pré-remplir avec l&apos;IA</h2>
        <p className="text-xs text-zinc-500">Prends l&apos;affiche en photo ou colle le texte de l&apos;offre : on remplit le formulaire pour toi.</p>
        <p className="mt-1 text-xs text-zinc-500">
          La photo ou le texte est envoyé à un service d&apos;IA externe.{" "}
          <Link href="/confidentialite" target="_blank" className="underline">Confidentialité</Link>
        </p>
      </div>
      <div className="flex gap-2">
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-zinc-300 bg-white py-2 text-sm font-semibold active:scale-95">
          📷 {photo ? "Changer la photo" : "Photo de l'offre"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => pickPhoto(e.target.files?.[0])}
          />
        </label>
        <button
          type="button"
          onClick={() => setShowText(!showText)}
          aria-pressed={showText}
          className={`flex-1 rounded-xl border py-2 text-sm font-semibold active:scale-95 ${
            showText ? "border-blue-600 bg-white text-blue-700" : "border-zinc-300 bg-white"
          }`}
        >
          ✍️ Coller un texte
        </button>
      </div>
      {photo && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (data URL) */}
          <img src={photo.preview} alt="Photo de l'offre" className="h-16 w-16 rounded-lg object-cover" />
          <button type="button" onClick={() => setPhoto(null)} className="text-sm text-zinc-500 underline">
            Retirer
          </button>
        </div>
      )}
      {showText && (
        <textarea
          className="min-h-24 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600"
          placeholder="Ex : « Chez Pizza Bruz, -30 % pour les étudiants le mardi soir jusqu'au 20 décembre »"
          maxLength={4000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}
      {(photo || (showText && text.trim())) && (
        <button
          type="button"
          onClick={analyse}
          disabled={busy}
          className="w-full rounded-xl bg-blue-600 py-2 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Analyse en cours…" : "Analyser et pré-remplir"}
        </button>
      )}
      {message && <p className={`text-sm ${tone[message.tone]}`}>{message.text}</p>}
    </section>
  );
}
