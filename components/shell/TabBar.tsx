"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";
import { interceptSessionNav } from "@/lib/allenamento/session-guard";
import { apriFeedback, focusCampoFeedback, leggiLocale, scriviLocale } from "@/lib/feedback/bus";
import { inSessioneAllenamento } from "@/lib/feedback/regole-suggerimento";
import { usePressioneLunga } from "@/hooks/usePressioneLunga";
import { QuickAddButton } from "./QuickAddButton";

// Sezioni con slot dedicato (vedi lib/sidebar-config.ts), più "Altro" come
// ultimo slot fisso per tutto il resto (Carte, Allenamento, Impostazioni...).
// Divise a metà attorno al pulsante centrale "+" (QuickAddButton).
const TAB_SECTIONS = SIDEBAR_SECTIONS.filter((s) => s.mobileTab);
const META = Math.ceil(TAB_SECTIONS.length / 2);
const PRIMA_META = TAB_SECTIONS.slice(0, META);
const SECONDA_META = TAB_SECTIONS.slice(META);

const CHIAVE_SCOPERTA = "radar.feedback.scopertaVista";
const SCOPERTA_DURATA_MS = 5000;

function isActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Pressione lunga sulla tab GIÀ attiva = feedback (vedi POTENZIAMENTO 1 in
// CLAUDE.md). Su una tab non attiva resta un tap normale, per non aprire il
// feedback per sbaglio mentre si cambia sezione. Il tap e il guard della
// sessione di allenamento restano quelli di prima.
function TabLink({
  href,
  label,
  icon: Icon,
  attivo,
  onPressioneLunga,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  attivo: boolean;
  onPressioneLunga: () => void;
}) {
  const { handlers, premuto, clickDaPressioneLunga } = usePressioneLunga({
    abilitata: attivo,
    onPressioneLunga,
    onRilascio: focusCampoFeedback,
  });

  return (
    <Link
      href={href}
      aria-current={attivo ? "page" : undefined}
      {...handlers}
      onClick={(e) => {
        if (clickDaPressioneLunga() || interceptSessionNav(href)) e.preventDefault();
      }}
      className={`app-static flex flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 transition-[color,opacity,transform] duration-150 active:opacity-60 ${
        attivo ? "text-accent" : "text-muted"
      } ${premuto ? "scale-90 opacity-60" : ""}`}
    >
      <Icon className="h-6 w-6" strokeWidth={attivo ? 2.25 : 1.75} />
      <span className="app-static text-[11px] leading-none font-medium">{label}</span>
    </Link>
  );
}

export function TabBar() {
  const pathname = usePathname();
  const nav = useRef<HTMLElement>(null);
  const bolla = useRef<HTMLSpanElement>(null);
  // Scoperta: la prima volta in assoluto compare un solo suggerimento sopra
  // la tab attiva. Il flag va salvato subito, così non ricompare anche se
  // l'utente cambia pagina prima dei 5 secondi.
  const [frecciaScoperta, setFrecciaScoperta] = useState<number | null>(null);
  const inSessione = inSessioneAllenamento(pathname);

  useEffect(() => {
    if (inSessione || leggiLocale(CHIAVE_SCOPERTA, false)) return;
    const attiva = nav.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!attiva || !window.matchMedia("(max-width: 767px)").matches) return;
    scriviLocale(CHIAVE_SCOPERTA, true);
    const r = attiva.getBoundingClientRect();
    const mostra = setTimeout(() => setFrecciaScoperta(r.left + r.width / 2), 800);
    const nascondi = setTimeout(() => setFrecciaScoperta(null), 800 + SCOPERTA_DURATA_MS);
    return () => {
      clearTimeout(mostra);
      clearTimeout(nascondi);
    };
  }, [inSessione]);

  // Bolla centrata sulla tab attiva ma tenuta dentro lo schermo (16px di
  // margine): sulle tab ai bordi resta spostata, la freccia no.
  useLayoutEffect(() => {
    const el = bolla.current;
    if (frecciaScoperta === null || !el) return;
    const w = el.offsetWidth;
    const left = Math.min(Math.max(frecciaScoperta - w / 2, 16), window.innerWidth - 16 - w);
    el.style.left = `${left}px`;
  }, [frecciaScoperta]);

  // Nascosta durante una sessione di allenamento attiva (/allenamenti/sessione/*):
  // più spazio al runner, meno tentazione di uscire a metà sessione.
  if (inSessione) return null;

  const suAltro = !TAB_SECTIONS.some((s) => isActive(s.href, pathname));

  function feedbackDaTab() {
    setFrecciaScoperta(null);
    apriFeedback({ origine: "tab" });
  }

  return (
    <nav
      ref={nav}
      aria-label="Navigazione principale"
      className="app-scroll app-static fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface-hover pb-[max(env(safe-area-inset-bottom),20px)] shadow-[0_-2px_8px_rgba(0,0,0,0.15)] md:hidden"
      style={{ height: "calc(var(--app-tabbar-height) + max(env(safe-area-inset-bottom), 20px))" }}
    >
      {frecciaScoperta !== null && (
        <>
          <span
            ref={bolla}
            role="status"
            className="pointer-events-none absolute bottom-full mb-3 whitespace-nowrap rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background shadow-lg"
          >
            Tieni premuto per segnalare qualcosa
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-full mb-[7px] h-3 w-3 rotate-45 bg-foreground"
            style={{ left: frecciaScoperta - 6 }}
          />
        </>
      )}
      {PRIMA_META.map((s) => (
        <TabLink
          key={s.id}
          href={s.href}
          label={s.label}
          icon={s.icon}
          attivo={isActive(s.href, pathname)}
          onPressioneLunga={feedbackDaTab}
        />
      ))}
      <QuickAddButton />
      {SECONDA_META.map((s) => (
        <TabLink
          key={s.id}
          href={s.href}
          label={s.label}
          icon={s.icon}
          attivo={isActive(s.href, pathname)}
          onPressioneLunga={feedbackDaTab}
        />
      ))}
      <TabLink href="/altro" label="Altro" icon={MoreHorizontal} attivo={suAltro} onPressioneLunga={feedbackDaTab} />
    </nav>
  );
}
