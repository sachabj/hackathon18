import { StoreIcon } from "@/components/icons";

export default function ChainBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`sw-badge ${className}`}
      style={{ backgroundColor: "var(--color-aubergine)", color: "var(--color-surface)" }}
    >
      <StoreIcon className="h-3.5 w-3.5" /> Grande enseigne
    </span>
  );
}
