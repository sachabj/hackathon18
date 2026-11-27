/** Grande case à toucher du parcours de préférences. */
export default function ChoiceTile({
  emoji,
  label,
  hint,
  badge,
  selected,
  row = false,
  onClick,
}: {
  emoji: string;
  label: string;
  hint?: string;
  badge?: number;
  selected: boolean;
  row?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative flex w-full items-center rounded-2xl border-2 p-3 transition active:scale-95 ${
        row ? "gap-3 text-left" : "min-h-24 flex-col justify-center gap-1 text-center"
      } ${selected ? "border-blue-600 bg-blue-50" : "border-zinc-200 bg-white"}`}
    >
      <span className="text-3xl" aria-hidden>
        {emoji}
      </span>
      <span className="min-w-0">
        <span className={`block text-sm font-semibold ${selected ? "text-blue-700" : "text-zinc-800"}`}>
          {label}
        </span>
        {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      </span>
      {selected && (
        <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-bold text-white">
          {badge ?? "✓"}
        </span>
      )}
    </button>
  );
}
