import { Apple, Bell, Calendar, Dumbbell, Layers, TrendingUp, Wallet, type LucideIcon } from "lucide-react";

export type SidebarSubsection = { href: string; label: string };

export type SidebarSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  disabled?: boolean;
  badge?: string;
  subsections?: SidebarSubsection[];
  // Sezioni con uno slot dedicato nella tab bar mobile (5 al massimo: le
  // altre restano raggiungibili solo da "Altro"). Cambiare la selezione è
  // una riga qui, la fonte resta unica per sidebar desktop e tab bar.
  mobileTab?: boolean;
};

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: "spese",
    label: "Spese",
    icon: Wallet,
    href: "/spese",
    mobileTab: true,
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
    mobileTab: true,
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
      { href: "/allenamenti/schede", label: "Le mie schede" },
      { href: "/allenamenti/storico", label: "Storico" },
    ],
  },
  {
    id: "alimentazione",
    label: "Alimentazione",
    icon: Apple,
    href: "/alimentazione",
    subsections: [
      { href: "/alimentazione", label: "Overview" },
      { href: "/alimentazione/gestione", label: "Gestione" },
      { href: "/alimentazione/template", label: "Template settimanale" },
      { href: "/alimentazione/aggiungi", label: "+ Aggiungi" },
      { href: "/alimentazione/profilo", label: "Profilo" },
    ],
  },
  {
    id: "agenda",
    label: "Agenda",
    icon: Calendar,
    href: "/agenda",
    mobileTab: true,
    subsections: [{ href: "/agenda", label: "Calendario" }],
  },
  {
    id: "impostazioni",
    label: "Impostazioni",
    icon: Bell,
    href: "/impostazioni",
  },
];
