/** Notifications annoncées mais pas encore codées : les interrupteurs sont désactivés. */
const ALERTS = [
  ["Bons plans à proximité", "Une alerte quand une offre est tout près de toi."],
  ["Validation de mes offres", "Une alerte quand un étudiant confirme un de tes bons plans."],
];

export default function NotificationsPanel() {
  return (
    <>
      <p className="text-sm font-medium" style={{ color: "var(--color-aubergine)" }}>
        Bientôt : pas encore disponible, aucune notification n&apos;est envoyée.
      </p>
      <ul className="space-y-3">
        {ALERTS.map(([title, hint]) => (
          <li key={title}>
            <button type="button" role="switch" aria-checked={false} disabled className="flex w-full items-center justify-between gap-3 text-left opacity-60">
              <span>
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-xs text-[var(--color-muted)]">{hint}</span>
              </span>
              <span aria-hidden className="flex h-6 w-11 shrink-0 items-center rounded-full p-0.5" style={{ backgroundColor: "var(--color-border)" }}>
                <span className="h-5 w-5 rounded-full bg-white shadow" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
