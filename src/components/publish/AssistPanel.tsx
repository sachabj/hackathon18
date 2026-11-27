"use client";

// Pré-remplissage par IA : photo d'une affiche (analysée dès qu'elle est prise) ou texte libre → brouillon.
// Responsable : Matteo.
import Link from "next/link";
import { useState } from "react";
import { CameraIcon, EditIcon } from "@/components/icons";
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
  /** Dernière analyse échouée : on propose de réessayer. */
  const [failed, setFailed] = useState(false);

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    setFailed(false);
    setBusy(true);
    let next: Photo;
    try {
      next = await photoToJpeg(file);
    } catch {
      setBusy(false);
      return setMessage({ tone: "error", text: "Impossible de lire cette photo." });
    }
    setPhoto(next);
    await analyse(next);
  }

  async function analyse(photo: Photo | null) {
    if (!photo && !text.trim()) return setMessage({ tone: "error", text: "Ajoute une photo ou un texte." });
    setBusy(true);
    setMessage(null);
    setFailed(false);
    try {
      const draft = await extractFromInput({
        text: text.trim() || undefined,
        image: photo ? { media_type: photo.media_type, data: photo.data } : undefined,
      });
      onDraft(draft, photo ? { data: photo.data, preview: photo.preview } : null);
      const check = draft.confidence === "basse" ? "Lecture difficile : vérifie bien chaque champ." : "Vérifie les champs pré-remplis avant de publier.";
      setMessage({ tone: draft.confidence === "basse" ? "warn" : "ok", text: [check, draft.notes].filter(Boolean).join(" ") });
    } catch (e) {
      setFailed(true);
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
    <section className="sw-card space-y-3 p-3" style={{ backgroundColor: "var(--color-lilac)", borderColor: "var(--color-aubergine)" }}>
      <div className="flex gap-2">
        <label
          className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl py-3 font-medium text-white active:scale-95 focus-within:ring-2 ${busy ? "opacity-60" : ""}`}
          style={{ backgroundColor: "var(--color-aubergine)" }}
        >
          <CameraIcon className="h-5 w-5" />
          {busy ? "Analyse en cours…" : photo ? "Reprendre la photo" : "Prendre l'offre en photo"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              pickPhoto(e.target.files?.[0]);
              e.target.value = ""; // pour pouvoir rechoisir le même fichier
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => setShowText(!showText)}
          aria-expanded={showText}
          className="flex shrink-0 items-center gap-1.5 rounded-2xl border px-3 text-sm font-medium active:scale-95"
          style={{ borderColor: "var(--color-aubergine)", backgroundColor: "var(--color-surface)", color: "var(--color-aubergine)" }}
        >
          <EditIcon className="h-4 w-4" /> Texte
        </button>
      </div>
      <p className="text-xs text-[var(--color-muted)]">
        L&apos;IA remplit le formulaire : la photo ou le texte est envoyé à un service externe.{" "}
        <Link href="/confidentialite" target="_blank" className="underline">Confidentialité</Link>
      </p>
      {photo && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (data URL) */}
          <img src={photo.preview} alt="Photo de l'offre" className="h-16 w-16 rounded-lg object-cover" />
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setPhoto(null);
              setFailed(false);
            }}
            className="text-sm text-[var(--color-muted)] underline"
          >
            Retirer
          </button>
        </div>
      )}
      {showText && (
        <textarea
          className="sw-field min-h-24 text-sm"
          placeholder="Ex : « Chez Pizza Bruz, -30 % pour les étudiants le mardi soir jusqu'au 20 décembre »"
          aria-label="Texte de l'offre"
          maxLength={4000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}
      {((showText && text.trim()) || (failed && photo)) && (
        <button
          type="button"
          onClick={() => analyse(photo)}
          disabled={busy}
          className="sw-btn-primary w-full py-2 text-sm"
          style={{ backgroundColor: "var(--color-aubergine)" }}
        >
          {busy ? "Analyse en cours…" : failed ? "Réessayer" : "Analyser et pré-remplir"}
        </button>
      )}
      {message && <p className={`text-sm ${tone[message.tone]}`} role="status">{message.text}</p>}
    </section>
  );
}
