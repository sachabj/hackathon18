// Icônes sobres (traits, pas d'emoji ; voir DESIGN_SHAREWOOD.md).
import type { ReactNode } from "react";

import {
  Bike,
  Bus,
  Calendar,
  Car,
  Dices,
  Drama,
  Dumbbell,
  Footprints,
  GraduationCap,
  Handshake,
  IdCard,
  Luggage,
  Mountain,
  Music,
  PartyPopper,
  PiggyBank,
  Plane,
  Popcorn,
  Repeat,
  Scale,
  Sofa,
  Sparkles,
  Store,
  Ticket,
  TrainFront,
  Volleyball,
  WavesLadder,
  type LucideIcon,
} from "lucide-react";
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
/** Drapeau : signaler un bon plan (tâche 71). */
export function FlagIcon({ className }: IconProps) {
  return <Stroke className={className}><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></Stroke>;
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
/** Carte étudiante : carte d'identité avec photo. */
/** Carte Sortir : billet perforé. */
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

// ---------- Icônes des choix et des conditions (tâche 53) : bibliothèque Lucide (licence ISC), même trait que les autres ----------
const lucide = (Icon: LucideIcon) =>
  function ChoiceIcon({ className = "h-5 w-5" }: IconProps) {
    return <Icon className={className} strokeWidth={1.8} aria-hidden />;
  };

export const GraduationCapIcon = lucide(GraduationCap);
export const StoreIcon = lucide(Store);
export const WalkIcon = lucide(Footprints);
export const BikeIcon = lucide(Bike);
export const BusIcon = lucide(Bus);
export const CarIcon = lucide(Car);
export const HandshakeIcon = lucide(Handshake);
export const TrainIcon = lucide(TrainFront);
export const PlaneIcon = lucide(Plane);
export const RepeatIcon = lucide(Repeat);
export const CalendarIcon = lucide(Calendar);
export const SofaIcon = lucide(Sofa);
export const CoinIcon = lucide(PiggyBank);
export const ScaleIcon = lucide(Scale);
export const SparklesIcon = lucide(Sparkles);
export const PopcornIcon = lucide(Popcorn);
export const MusicNoteIcon = lucide(Music);
export const PartyIcon = lucide(PartyPopper);
export const DiceIcon = lucide(Dices);
export const MaskIcon = lucide(Drama);
export const SwimIcon = lucide(WavesLadder);
export const DumbbellIcon = lucide(Dumbbell);
export const BasketballIcon = lucide(Volleyball);
export const BootIcon = lucide(Mountain);
export const SuitcaseIcon = lucide(Luggage);
export const IdCardIcon = lucide(IdCard);
export const TicketIcon = lucide(Ticket);
