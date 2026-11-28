// Icônes sobres (traits, pas d'emoji ; voir DESIGN_SHAREWOOD.md).
import type { ReactNode } from "react";

type IconProps = { className?: string };

const base = "none" as const;

export function PlusIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

export function HeartIcon({ className = "h-5 w-5", filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : base} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M12 20.3 4.6 13c-2-2-2-5.1 0-7 1.9-1.9 4.9-1.9 6.8 0l.6.6.6-.6c1.9-1.9 4.9-1.9 6.8 0 2 2 2 5 0 7l-7.4 7.3Z" />
    </svg>
  );
}

export function UserIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    </svg>
  );
}

export function TagIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 12 12.5 4.5 4 5l-.5 8.5L11 21l9-9Z" />
      <circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChartIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}

export function StoreIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 10 5 4h14l1 6M4 10v9h16v-9M4 10h16" />
      <path d="M9 19v-5h6v5" />
    </svg>
  );
}

export function ChevronDownIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Stroke({ className = "h-5 w-5", viewBox = "0 0 24 24", children }: IconProps & { viewBox?: string; children: ReactNode }) {
  return (
    <svg viewBox={viewBox} className={className} fill={base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

export function NavigationIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M21 3 3 10.5l7.8 2.7L13.5 21 21 3Z" /></Stroke>;
}
export function SearchIcon({ className }: IconProps) {
  return <Stroke className={className}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></Stroke>;
}
export function ArrowLeftIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M19 12H5" /><path d="M11 5l-7 7 7 7" /></Stroke>;
}
export function CheckIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M5 13l4 4L19 7" /></Stroke>;
}
export function CloseIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></Stroke>;
}
export function UndoIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M7 7 3 11l4 4" /><path d="M3 11h11a6 6 0 1 1 0 12h-2" /></Stroke>;
}
export function EditIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 16v4Z" /><path d="M14 6l4 4" /></Stroke>;
}
export function TrashIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M5 7h14" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M7 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /><path d="M10 11v6" /><path d="M14 11v6" />
    </Stroke>
  );
}
export function LockClosedIcon({ className }: IconProps) {
  return <Stroke className={className}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Stroke>;
}
export function LogoutIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" /><path d="M15 16l4-4-4-4" /><path d="M19 12H9" /></Stroke>;
}
export function WarningIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4" /><path d="M12 17h.01" /></Stroke>;
}
export function PinIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></Stroke>;
}
export function CameraIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" /></Stroke>;
}
export function StarIcon({ className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "h-5 w-5"} fill={filled ? "currentColor" : base} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M12 3.5l2.6 5.4 5.9.9-4.3 4.2 1 5.9L12 17l-5.2 2.9 1-5.9-4.3-4.2 5.9-.9L12 3.5Z" />
    </svg>
  );
}
export function ThumbsUpIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M7 11v9H4v-9h3Z" /><path d="M7 11l3.5-7a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2l-1.5 6a2 2 0 0 1-2 1.5H7" /></Stroke>;
}
export function ThumbsDownIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M17 13V4h3v9h-3Z" /><path d="M17 13l-3.5 7a2 2 0 0 1-2-2v-4H6a2 2 0 0 1-2-2l1.5-6A2 2 0 0 1 7.5 4H17" /></Stroke>;
}
export function ProhibitedIcon({ className }: IconProps) {
  return <Stroke className={className}><circle cx="12" cy="12" r="9" /><path d="M6 6l12 12" /></Stroke>;
}
/** Flèche tirée vers le haut à droite : la monnaie « Les Flèches ». */
export function ArrowShotIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      {/* hampe, pointe pleine, empennage */}
      <path d="M4 20 16 8" /><path d="M20.5 3.5 12.8 5.6l5.6 5.6Z" fill="currentColor" />
      <path d="M3.5 15.5h5v5" /><path d="M6.8 12.2h5v5" />
    </Stroke>
  );
}
/** Cœur traversé d'une flèche : l'onglet « Ciblés ». */
export function HeartArrowIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M12 19.5 6.3 13.9c-1.6-1.6-1.6-4.1 0-5.6 1.5-1.5 3.9-1.5 5.4 0l.3.4.3-.4c1.5-1.5 3.9-1.5 5.4 0 1.6 1.5 1.6 4 0 5.6L12 19.5Z" />
      <path d="M2.5 21.5 7 17M17 7l4.5-4.5M17.5 2.5h4v4M2.5 18H6v3.5" />
    </Stroke>
  );
}
export function FlameIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M12 2c2 3-1 4-1 7a3 3 0 0 0 6 0c1.5 2 1 4 1 5a6 6 0 0 1-12 0c0-4 2-5 3-8 .5 1 1 2 1 3 0-3 1-5 2-7Z" /></Stroke>;
}
export function CheckCircleIcon({ className }: IconProps) {
  return <Stroke className={className}><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.5 2.5L16 9.3" /></Stroke>;
}
export function MoonIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" /></Stroke>;
}
export function BedIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M3 18v-7a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v2" /><path d="M12 13h7a2 2 0 0 1 2 2v3" /><path d="M3 18h18" /><path d="M3 13v7" /><path d="M21 15v3" /></Stroke>;
}
export function SuitcaseIcon({ className }: IconProps) {
  return <Stroke className={className}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M3 12h18" /></Stroke>;
}
export function HomeIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" /></Stroke>;
}
export function GlobeIcon({ className }: IconProps) {
  return <Stroke className={className}><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></Stroke>;
}
export function TargetIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </Stroke>
  );
}
export function BuildingsIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M4 20V9l5-3v14" /><path d="M9 20V6l6-3v17" /><path d="M15 20V11l5-2v11" /></Stroke>;
}
export function SparklesIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M12 3v4" /><path d="M12 17v4" /><path d="M3 12h4" /><path d="M17 12h4" />
      <path d="M6 6l2.5 2.5" /><path d="M15.5 15.5 18 18" /><path d="M18 6l-2.5 2.5" /><path d="M8.5 15.5 6 18" />
    </Stroke>
  );
}
export function CoinIcon({ className }: IconProps) {
  return <Stroke className={className}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.2a2.8 2.8 0 1 0 0 5.6" /><path d="M8.5 10.5h3" /><path d="M8.5 13.5h3" /></Stroke>;
}
export function ScaleIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M12 3v15" /><path d="M5 7h14" />
      <path d="M5 7 3 12a2.5 2.5 0 0 0 5 0L6 7Z" /><path d="M19 7l-2 5a2.5 2.5 0 0 0 5 0l-2-5Z" />
      <path d="M8 21h8" />
    </Stroke>
  );
}
export function CalendarIcon({ className }: IconProps) {
  return <Stroke className={className}><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 10h16" /><path d="M8 3v4" /><path d="M16 3v4" /></Stroke>;
}
export function RepeatIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M4 7h11a4 4 0 0 1 4 4v1" /><path d="M12 4l3 3-3 3" /><path d="M20 17H9a4 4 0 0 1-4-4v-1" /><path d="M12 20l-3-3 3-3" /></Stroke>;
}
export function SofaIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" /><path d="M3 12h18v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4Z" /><path d="M5 17v3" /><path d="M19 17v3" /></Stroke>;
}
export function BootIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M9 3v8l-5 4v3a1 1 0 0 0 1 1h14a2 2 0 0 0 0-4h-1l-5-3V3Z" /></Stroke>;
}
export function HandshakeIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M2 12l4-3 4 2 3-2 2 1 4-2 3 3" /><path d="M8 11l3 4" /><path d="M12 10l3 4.5" /><path d="M16 9l2.5 3.5" /></Stroke>;
}
export function WalkIcon({ className }: IconProps) {
  return <Stroke className={className}><circle cx="13" cy="4" r="1.6" /><path d="M10 21l1.5-5-2-2 1-5 4 1 2 3 3 1" /><path d="M11 14l-3 2-2 4" /></Stroke>;
}
export function BikeIcon({ className }: IconProps) {
  return <Stroke className={className}><circle cx="6" cy="17" r="3.2" /><circle cx="18" cy="17" r="3.2" /><path d="M6 17l4-8h4l3 5" /><path d="M10 9h3" /><path d="M14 14h4" /></Stroke>;
}
export function BusIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 13h18" />
      <circle cx="7.5" cy="17.5" r="1" /><circle cx="16.5" cy="17.5" r="1" /><path d="M6 6v3" /><path d="M18 6v3" />
    </Stroke>
  );
}
export function CarIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M4 16V12l2-5h12l2 5v4" /><path d="M4 16h16" /><circle cx="8" cy="17.5" r="1.5" /><circle cx="16" cy="17.5" r="1.5" /></Stroke>;
}
export function TrainIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <rect x="6" y="4" width="12" height="13" rx="3" /><path d="M6 10h12" />
      <circle cx="9" cy="14" r="1" /><circle cx="15" cy="14" r="1" /><path d="M8 20l-2 2" /><path d="M16 20l2 2" />
    </Stroke>
  );
}
export function PlaneIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M21 12 4 6l1.5 4.5L13 12l-7.5 1.5L4 18l17-6Z" /></Stroke>;
}
export function PopcornIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M7 9l1.5 12h7L17 9" /><path d="M6 9c0-2 2-3.5 3-2 .5-2 3-2 3 0 0-2 2.5-2.5 3-.5 1-1 3 0 3 2.5" /></Stroke>;
}
export function MusicNoteIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M9 18V5l10-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></Stroke>;
}
export function PartyIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M4 20l5-14 11 11-14 5Z" /><path d="M13 4l1.5 1.5" /><path d="M17 3l1 2" /><path d="M19 7l2 1" /></Stroke>;
}
export function DiceIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    </Stroke>
  );
}
export function MaskIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M4 10c0-4 3.5-7 8-7s8 3 8 7-3 6-8 6-8-2-8-6Z" /><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" /><path d="M9 14c1 1 5 1 6 0" /></Stroke>;
}
export function SwimIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="7" cy="5" r="1.6" /><path d="M4 11l3-2 3 2 3-2 2 1.5" />
      <path d="M2 16c1.5 1.5 3 1.5 4.5 0s3-1.5 4.5 0 3 1.5 4.5 0 3-1.5 4.5 0" />
      <path d="M2 20c1.5 1.5 3 1.5 4.5 0s3-1.5 4.5 0 3 1.5 4.5 0 3-1.5 4.5 0" />
    </Stroke>
  );
}
export function DumbbellIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M4 9v6" /><path d="M2 10v4" /><path d="M8 7v10" /><path d="M16 7v10" /><path d="M20 9v6" /><path d="M22 10v4" /><path d="M8 12h8" /></Stroke>;
}
export function BasketballIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3v18" />
      <path d="M5.5 5.5c3 3 3 10 0 13" /><path d="M18.5 5.5c-3 3-3 10 0 13" />
    </Stroke>
  );
}
export function GraduationCapIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M2 9l10-4 10 4-10 4-10-4Z" /><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" /><path d="M22 9v6" /></Stroke>;
}
/** Carte étudiante : carte d'identité avec photo. */
export function IdCardIcon({ className }: IconProps) {
  return <Stroke className={className}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.6-1.4 1.7-2 3-2s2.4.6 3 2" /><path d="M14 10h4M14 13h3" /></Stroke>;
}
/** Carte Sortir : billet perforé. */
export function TicketIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4Z" /><path d="M15 8v8" strokeDasharray="2 2" /></Stroke>;
}
/** Lien vers un site externe. */
export function ExternalLinkIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></Stroke>;
}
/** Maillons de chaîne (champ « lien »). */
export function LinkIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Stroke>;
}
export function ShareIcon({ className }: IconProps) {
  return <Stroke className={className}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" /></Stroke>;
}
export function CopyIcon({ className }: IconProps) {
  return <Stroke className={className}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15" /></Stroke>;
}
export function BellIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></Stroke>;
}
export function HelpIcon({ className }: IconProps) {
  return <Stroke className={className}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.700" /><path d="M12 17h.01" /></Stroke>;
}
export function ShieldIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M12 3 5 6v5c0 4.600 3 8.200 7 10 4-1.800 7-5.400 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></Stroke>;
}
export function SlidersIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></Stroke>;
}
export function HistoryIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" /><path d="M4 4v4.5h4.5" /><path d="M12 8v4.5l3 1.800" /></Stroke>;
}
