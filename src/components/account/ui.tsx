"use client";

import { useState } from "react";

export const inputClass =
  "mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base font-normal outline-none focus:border-blue-600";
export const primaryClass = "w-full rounded-xl bg-blue-600 py-2.5 font-semibold text-white disabled:opacity-50";
export const secondaryClass = "w-full rounded-xl border border-zinc-300 py-2.5 font-semibold disabled:opacity-50";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-zinc-200 p-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** Une action asynchrone avec son état : en cours, réussite ou erreur. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(action: () => Promise<string | void>) {
    setBusy(true);
    setMessage(null);
    try {
      const text = await action();
      if (text) setMessage({ ok: true, text });
      return true;
    } catch (e) {
      setMessage({ ok: false, text: (e as Error).message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, message, run, clear: () => setMessage(null) };
}

export function Feedback({ message }: { message: { ok: boolean; text: string } | null }) {
  if (!message) return null;
  return (
    <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>
      {message.text}
    </p>
  );
}
