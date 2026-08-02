import { Calendar, Layers, TrendingUp, Wallet, type LucideIcon } from "lucide-react";

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
