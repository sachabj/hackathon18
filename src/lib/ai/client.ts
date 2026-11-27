"use client";

// Côté navigateur : appel à /api/assist (pré-remplissage) et compression de la photo.
import type { AssistDraft, AssistRequest, AssistResponse } from "./types";

export class AssistUnavailable extends Error {}

async function call<T>(body: AssistRequest): Promise<T> {
  let res: Response;
  try {
    res = await fetch("/api/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AssistUnavailable("Assistant injoignable (réseau).");
  }
  const json = (await res.json().catch(() => null)) as AssistResponse<T> | null;
  if (!json) throw new AssistUnavailable("Assistant indisponible.");
  if (!json.ok) throw json.unavailable ? new AssistUnavailable(json.error) : new Error(json.error);
  return json.result;
}

export const extractFromInput = (input: { text?: string; image?: { media_type: "image/jpeg"; data: string } }) =>
  call<AssistDraft>({ action: "extract", ...input });

/** Photo redimensionnée (1568 px max, taille idéale pour Claude) et compressée en JPEG, en base64. */
export async function photoToJpeg(file: File): Promise<{ media_type: "image/jpeg"; data: string; preview: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1568 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const preview = canvas.toDataURL("image/jpeg", 0.85);
  return { media_type: "image/jpeg", data: preview.slice(preview.indexOf(",") + 1), preview };
}
