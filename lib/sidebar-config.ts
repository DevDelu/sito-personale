import { Calendar, Dumbbell, Layers, TrendingUp, Wallet, type LucideIcon } from "lucide-react";

export type SidebarSubsection = { href: string; label: string };

export type SidebarSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  disabled?: boolean;
  badge?: string;
  subsections?: SidebarSubsection[];
};

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: "spese",
    label: "Spese",
    icon: Wallet,
    href: "/spese",
    subsections: [
      { href: "/spese", label: "Overview" },
      { href: "/spese/gestione", label: "Gestione" },
      { href: "/spese/importa", label: "Importa" },
      { href: "/spese/nuovo", label: "+ Aggiungi" },
    ],
  },
  {
    id: "investimenti",
    label: "Investimenti",
    icon: TrendingUp,
    href: "/investimenti",
    subsections: [
      { href: "/investimenti", label: "Overview" },
      { href: "/investimenti/gestione", label: "Gestione" },
      { href: "/investimenti/importa", label: "Importa" },
    ],
  },
  {
    id: "carte",
    label: "Carte",
    icon: Layers,
    href: "/carte",
    subsections: [
      { href: "/carte", label: "Overview" },
      { href: "/carte/nuova", label: "+ Aggiungi" },
    ],
  },
  {
    id: "allenamenti",
    label: "Allenamento",
    icon: Dumbbell,
    href: "/allenamenti",
    subsections: [
      { href: "/allenamenti", label: "Overview" },
      { href: "/allenamenti/scheda", label: "Gestione scheda" },
      { href: "/allenamenti/storico", label: "Storico" },
    ],
  },
  {
    id: "agenda",
    label: "Agenda",
    icon: Calendar,
    href: "#",
    disabled: true,
    badge: "presto",
  },
];
