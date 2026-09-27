"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Toast } from "@/components/toast";
import { FeedbackSheet } from "@/components/feedback/FeedbackSheet";
import {
  accodaFeedback,
  apriFeedback,
  leggiLocale,
  leggiUltimaPagina,
  prendiCodaFeedback,
  registraAperturaFeedback,
  salvaUltimaPagina,
  scriviLocale,
  type AperturaFeedback,
} from "@/lib/feedback/bus";
import { paginaTemplate } from "@/lib/feedback/pagina";
import {
  STATO_SUGGERIMENTO_INIZIALE,
  SUGGERIMENTO_DURATA_MS,
  dopoAccettato,
  dopoIgnorato,
  dopoMostrato,
  inSessioneAllenamento,
  puoMostrareSuggerimento,
  type StatoSuggerimento,
} from "@/lib/feedback/regole-suggerimento";
import type { AttritoEvento, AttritoTipo, FeedbackPayload, FeedbackTipo } from "@/lib/feedback/types";

const CHIAVE_SUGGERIMENTO = "radar.feedback.suggerimento";
const ATTRITI_MAX = 10;

function campoConFocus(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLElement && (el.matches("input, textarea, select") || el.isContentEditable);
}

function sheetAperto(): boolean {
  return document.querySelector(".modal-overlay") !== null;
}

function oggiLocale(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function queryChiavi(): string[] {
  return Array.from(new Set(new URLSearchParams(window.location.search).keys()));
}

async function inviaFeedback(payload: FeedbackPayload) {
  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    // 400/403: il server non lo accetterà mai, inutile ritentare.
    if (res.ok || res.status === 400 || res.status === 403) return;
  } catch {
    // Offline o rete assente: finisce in coda come un errore del server.
  }
  accodaFeedback(payload);
}

// Montato una volta nel layout privato: ospita lo sheet di feedback (aperto
// da tab bar, /altro, sidebar, scorciatoia F o suggerimento), rileva gli
// attriti in tempo reale (oggi errore_api/errore_js, gli altri arriveranno
// col tracciamento d'uso) e svuota la coda offline all'avvio.
export function FeedbackProvider() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [apertura, setApertura] = useState<AperturaFeedback | null>(null);
  const aperturaRef = useRef<AperturaFeedback | null>(null);
  const [suggerimento, setSuggerimento] = useState<AttritoEvento | null>(null);
  const suggerimentoRef = useRef<AttritoEvento | null>(null);
  const [ricevuti, setRicevuti] = useState(0);
  const attriti = useRef<AttritoEvento[]>([]);
  const svuotando = useRef(false);

  useEffect(() => {
    aperturaRef.current = apertura;
    suggerimentoRef.current = suggerimento;
  }, [apertura, suggerimento]);

  // "Ultima pagina prima di Altro": il feedback aperto da /altro allega
  // quella, non /altro stesso.
  useEffect(() => {
    pathnameRef.current = pathname;
    if (pathname !== "/altro") salvaUltimaPagina({ pagina: paginaTemplate(pathname), query_chiavi: queryChiavi() });
  }, [pathname]);

  // Cambiando pagina il momento è passato: il suggerimento sparisce senza
  // contare come ignorato (non è stato davvero visto per 4 secondi).
  const [paginaSuggerimento, setPaginaSuggerimento] = useState(pathname);
  if (paginaSuggerimento !== pathname) {
    setPaginaSuggerimento(pathname);
    if (suggerimento) setSuggerimento(null);
  }

  // flushSync: se l'apertura arriva da un tap (riga in /altro, suggerimento),
  // lo sheet e il suo autoFocus vengono montati dentro lo stesso gesto, e iOS
  // apre subito la tastiera.
  useEffect(() => {
    registraAperturaFeedback((a) => {
      if (aperturaRef.current) return;
      aperturaRef.current = a;
      flushSync(() => {
        setSuggerimento(null);
        setApertura(a);
      });
    });
    return () => registraAperturaFeedback(null);
  }, []);

  const segnalaAttrito = useCallback((tipo: AttritoTipo, dettaglio?: string) => {
    const pagina = paginaTemplate(pathnameRef.current);
    const evento: AttritoEvento = { tipo, pagina, at: new Date().toISOString(), dettaglio: dettaglio?.slice(0, 200) };
    attriti.current = [...attriti.current, evento].slice(-ATTRITI_MAX);

    if (aperturaRef.current || suggerimentoRef.current) return;
    const stato = leggiLocale<StatoSuggerimento>(CHIAVE_SUGGERIMENTO, STATO_SUGGERIMENTO_INIZIALE);
    const oggi = oggiLocale();
    const mostra = puoMostrareSuggerimento(stato, {
      pagina,
      oggi,
      adesso: new Date(),
      inSessioneAllenamento: inSessioneAllenamento(pathnameRef.current),
      campoConFocus: campoConFocus(),
      sheetAperto: sheetAperto(),
    });
    if (!mostra) return;
    scriviLocale(CHIAVE_SUGGERIMENTO, dopoMostrato(stato, pagina, oggi));
    suggerimentoRef.current = evento;
    setSuggerimento(evento);
  }, []);

  // Rilevamento attriti senza tabella eventi: risposte 5xx dalle nostre API
  // ed errori JS non gestiti.
  useEffect(() => {
    const fetchOriginale = window.fetch;
    const fetchOsservato: typeof fetch = async (input, init) => {
      const res = await fetchOriginale(input, init);
      try {
        const href = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        const url = new URL(href, window.location.href);
        const nostraApi = url.origin === window.location.origin && url.pathname.startsWith("/api/");
        if (nostraApi && !url.pathname.startsWith("/api/feedback") && res.status >= 500) {
          const metodo = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
          segnalaAttrito("errore_api", `${metodo} ${paginaTemplate(url.pathname)} ${res.status}`);
        }
      } catch {
        // Mai rompere la fetch dell'app per colpa dell'osservatore.
      }
      return res;
    };
    window.fetch = fetchOsservato;

    function onErrore(e: ErrorEvent) {
      // Rumore noto dei browser, non un problema dell'app.
      if (!e.message || e.message === "Script error." || e.message.includes("ResizeObserver loop")) return;
      segnalaAttrito("errore_js", e.message);
    }
    function onRejection(e: PromiseRejectionEvent) {
      const motivo = e.reason instanceof Error ? e.reason.message : String(e.reason);
      segnalaAttrito("errore_js", motivo);
    }
    window.addEventListener("error", onErrore);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      if (window.fetch === fetchOsservato) window.fetch = fetchOriginale;
      window.removeEventListener("error", onErrore);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [segnalaAttrito]);

  // Il suggerimento sparisce da solo dopo 4 secondi: conta come ignorato.
  useEffect(() => {
    if (!suggerimento) return;
    const timer = setTimeout(() => {
      const stato = leggiLocale<StatoSuggerimento>(CHIAVE_SUGGERIMENTO, STATO_SUGGERIMENTO_INIZIALE);
      scriviLocale(CHIAVE_SUGGERIMENTO, dopoIgnorato(stato, new Date()));
      suggerimentoRef.current = null;
      setSuggerimento(null);
    }, SUGGERIMENTO_DURATA_MS);
    return () => clearTimeout(timer);
  }, [suggerimento]);

  // Scorciatoia desktop F, solo senza campi a fuoco né sheet aperti.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "f" && e.key !== "F") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (campoConFocus() || sheetAperto() || aperturaRef.current) return;
      e.preventDefault();
      apriFeedback({ origine: "desktop" });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Coda offline: reinvio all'avvio e al ritorno della connessione.
  useEffect(() => {
    async function svuota() {
      if (!navigator.onLine || svuotando.current) return;
      svuotando.current = true;
      try {
        for (const payload of prendiCodaFeedback()) await inviaFeedback(payload);
      } finally {
        svuotando.current = false;
      }
    }
    void svuota();
    window.addEventListener("online", svuota);
    return () => window.removeEventListener("online", svuota);
  }, []);

  const chiudi = useCallback(() => {
    aperturaRef.current = null;
    setApertura(null);
  }, []);

  const invia = useCallback(
    (tipo: FeedbackTipo, testo: string) => {
      const a = aperturaRef.current;
      if (!a) return;
      const ultima = pathname === "/altro" && !a.pagina ? leggiUltimaPagina() : null;
      const payload: FeedbackPayload = {
        pagina: a.pagina ?? ultima?.pagina ?? paginaTemplate(pathname),
        tipo,
        testo,
        origine: a.origine,
        contesto: {
          query_chiavi: ultima ? ultima.query_chiavi : queryChiavi(),
          viewport: window.matchMedia("(min-width: 768px)").matches ? "desktop" : "mobile",
          tema: document.documentElement.getAttribute("data-theme") === "dark" ? "scuro" : "chiaro",
          attrito: a.attrito ?? null,
          attriti_recenti: attriti.current,
        },
      };
      chiudi();
      // L'utente vede "Ricevuto" anche offline: il feedback aspetta in coda.
      setRicevuti((n) => n + 1);
      void inviaFeedback(payload);
    },
    [pathname, chiudi]
  );

  function apriDaSuggerimento() {
    const evento = suggerimentoRef.current;
    if (!evento) return;
    const stato = leggiLocale<StatoSuggerimento>(CHIAVE_SUGGERIMENTO, STATO_SUGGERIMENTO_INIZIALE);
    scriviLocale(CHIAVE_SUGGERIMENTO, dopoAccettato(stato));
    suggerimentoRef.current = null;
    apriFeedback({ origine: "suggerimento", tipo: "problema", attrito: evento, pagina: evento.pagina });
  }

  return (
    <>
      {apertura && (
        <FeedbackSheet
          tipoIniziale={apertura.tipo ?? (apertura.attrito ? "problema" : "complicato")}
          onClose={chiudi}
          onInvia={invia}
        />
      )}

      {suggerimento && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--app-tabbar-height)+max(env(safe-area-inset-bottom),20px)+0.75rem)] z-40 flex justify-center px-4 md:bottom-6">
          <button
            type="button"
            onClick={apriDaSuggerimento}
            className="app-static animate-slide-up pointer-events-auto flex min-h-[44px] items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg active:opacity-80"
          >
            <MessageCircle className="h-4 w-4" />
            Qualcosa non va? Dimmelo
          </button>
        </div>
      )}

      {ricevuti > 0 && <Toast key={ricevuti} message="Ricevuto. Ci lavoro stanotte." />}
    </>
  );
}
