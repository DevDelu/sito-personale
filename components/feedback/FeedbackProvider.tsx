"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { usePathname } from "next/navigation";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Toast } from "@/components/toast";
import { FeedbackSheet, type BozzaFeedback } from "@/components/feedback/FeedbackSheet";
import { segnaNonRisolto, segnaVerificato } from "@/app/(private)/feedback/actions";
import {
  accodaFeedback,
  apriFeedback,
  leggiLocale,
  leggiSessione,
  leggiUltimaPagina,
  prendiCodaFeedback,
  prendiEvidenziazione,
  registraAperturaFeedback,
  registraDaVerificareCambiati,
  salvaUltimaPagina,
  scriviLocale,
  scriviSessione,
  type AperturaFeedback,
} from "@/lib/feedback/bus";
import { catturaContesto, catturaPunto, evidenziaPunto, type ContestoCatturato, type PuntoCatturato } from "@/lib/feedback/cattura";
import { etichettaAreaBreve } from "@/lib/feedback/aree";
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
import {
  VERIFICA_DURATA_MS,
  VERIFICA_EVIDENZIA_MS,
  daVerificareQui,
  puoMostrareVerifica,
} from "@/lib/feedback/regole-verifica";
import type { FeedbackBreve, FeedbackDaVerificare } from "@/lib/feedback/queries";
import type { AttritoEvento, AttritoTipo, FeedbackPayload } from "@/lib/feedback/types";

const CHIAVE_SUGGERIMENTO = "radar.feedback.suggerimento";
const CHIAVE_VERIFICHE_SESSIONE = "radar.feedback.verificheMostrate";
const ATTRITI_MAX = 10;
// Attesa dopo la navigazione prima dell'avviso di verifica o
// dell'evidenziazione: la pagina deve aver disegnato i suoi elementi.
const ATTESA_PAGINA_MS = 900;

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

async function leggiJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    return res.ok ? ((await res.json()) as T) : fallback;
  } catch {
    return fallback;
  }
}

function etichettaPunto(p: PuntoCatturato | null): string | null {
  if (!p) return null;
  const area = etichettaAreaBreve(p.area);
  const el = p.punto.etichetta || p.punto.ruolo;
  return area ? `${area} › ${el}` : el;
}

// Montato una volta nel layout privato: ospita lo sheet di feedback (aperto
// da tab bar, /altro, sidebar, scorciatoia F o suggerimento), cattura il
// contesto all'apertura (pagina, area, entità, scroll), gestisce "Indica il
// punto", rileva gli attriti in tempo reale, svuota la coda offline e
// mostra l'avviso di verifica sui feedback `da-verificare` (solo owner).
export function FeedbackProvider({ owner }: { owner: boolean }) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [apertura, setApertura] = useState<AperturaFeedback | null>(null);
  const aperturaRef = useRef<AperturaFeedback | null>(null);
  const [contesto, setContesto] = useState<ContestoCatturato | null>(null);
  const [bozza, setBozza] = useState<BozzaFeedback>({ tipo: "complicato", testo: "" });
  const [punto, setPunto] = useState<PuntoCatturato | null>(null);
  const [puntando, setPuntando] = useState(false);
  const [aperti, setAperti] = useState<FeedbackBreve[]>([]);
  const [notaPer, setNotaPer] = useState<FeedbackBreve | null>(null);
  const [suggerimento, setSuggerimento] = useState<AttritoEvento | null>(null);
  const suggerimentoRef = useRef<AttritoEvento | null>(null);
  const [ricevuto, setRicevuto] = useState<{ n: number; messaggio: string }>({ n: 0, messaggio: "" });
  const [daVerificare, setDaVerificare] = useState<FeedbackDaVerificare[] | null>(null);
  const [verifica, setVerifica] = useState<FeedbackDaVerificare | null>(null);
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
    if (pathname !== "/altro") {
      salvaUltimaPagina({
        pagina: paginaTemplate(pathname),
        query_chiavi: queryChiavi(),
        url: `${window.location.pathname}${window.location.search}`,
      });
    }
  }, [pathname]);

  // Cambiando pagina il momento è passato: suggerimento e avviso di
  // verifica spariscono (il suggerimento senza contare come ignorato).
  const [paginaPrecedente, setPaginaPrecedente] = useState(pathname);
  if (paginaPrecedente !== pathname) {
    setPaginaPrecedente(pathname);
    if (suggerimento) setSuggerimento(null);
    if (verifica) setVerifica(null);
  }

  // flushSync: se l'apertura arriva da un tap (riga in /altro, suggerimento),
  // lo sheet e il suo autoFocus vengono montati dentro lo stesso gesto, e iOS
  // apre subito la tastiera. Il contesto si cattura PRIMA di montare lo
  // sheet, che è a sua volta un modale.
  useEffect(() => {
    registraAperturaFeedback((a) => {
      if (aperturaRef.current) return;
      aperturaRef.current = a;
      const daAltro = pathnameRef.current === "/altro" && !a.pagina;
      const ultima = daAltro ? leggiUltimaPagina() : null;
      const catturato: ContestoCatturato = ultima
        ? { route: ultima.pagina, url: ultima.url ?? ultima.pagina, area: null, entita: null, scroll_y: 0 }
        : catturaContesto();
      flushSync(() => {
        setSuggerimento(null);
        setVerifica(null);
        setContesto(catturato);
        setBozza({ tipo: a.tipo ?? (a.attrito ? "problema" : "complicato"), testo: "" });
        setPunto(null);
        setNotaPer(null);
        setAperti([]);
        setApertura(a);
      });
      if (!a.riapertoId) {
        void leggiJson<{ feedback: FeedbackBreve[] }>(
          `/api/feedback?route=${encodeURIComponent(catturato.route)}`,
          { feedback: [] }
        ).then(({ feedback }) => {
          if (aperturaRef.current === a) setAperti(feedback);
        });
      }
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

  // Scorciatoia desktop F, solo senza campi a fuoco. Funziona anche con un
  // modale aperto: il feedback ne cattura l'area.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "f" && e.key !== "F") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (campoConFocus() || aperturaRef.current) return;
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
    setPuntando(false);
  }, []);

  const invia = useCallback(() => {
    const a = aperturaRef.current;
    if (!a || !contesto) return;
    const testo = bozza.testo.trim();
    const notaSu = a.riapertoId ?? notaPer?.id ?? null;
    chiudi();
    // "Non risolto" senza testo: la riapertura è già registrata.
    if (!testo) return;
    const payload: FeedbackPayload = {
      route: a.pagina ?? contesto.route,
      url: contesto.url,
      area: punto?.area ?? contesto.area,
      entita: punto?.entita ?? contesto.entita,
      punto: punto?.punto ?? null,
      tipo: bozza.tipo,
      testo,
      origine: a.origine,
      contesto: {
        query_chiavi:
          pathnameRef.current === "/altro" && !a.pagina
            ? (leggiUltimaPagina()?.query_chiavi ?? [])
            : queryChiavi(),
        viewport: window.matchMedia("(min-width: 768px)").matches ? "desktop" : "mobile",
        tema: document.documentElement.getAttribute("data-theme") === "dark" ? "scuro" : "chiaro",
        scroll_y: contesto.scroll_y,
        attrito: a.attrito ?? null,
        attriti_recenti: attriti.current,
      },
      nota_per: notaSu,
    };
    // L'utente vede la conferma anche offline: il feedback aspetta in coda.
    setRicevuto((r) => ({ n: r.n + 1, messaggio: notaSu ? "Nota aggiunta." : "Ricevuto. Ci lavoro stanotte." }));
    void inviaFeedback(payload);
  }, [bozza, contesto, notaPer, punto, chiudi]);

  // "Indica il punto": lo sheet si smonta, la pagina resta visibile con una
  // barra in alto. Il prossimo tap NON attiva l'elemento: intercettato in
  // fase di capture su window, prima dei listener di React sulla radice.
  useEffect(() => {
    if (!puntando) return;
    const inBarra = (t: EventTarget | null) => t instanceof Element && !!t.closest("[data-fb-barra-punto]");

    function blocca(e: Event) {
      if (inBarra(e.target)) return;
      e.stopPropagation();
      // mousedown: evita che un campo prenda il focus (e apra la tastiera).
      if (e.type === "mousedown") e.preventDefault();
    }
    function onClick(e: MouseEvent) {
      if (inBarra(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      const catturato = catturaPunto(target, e.clientX, e.clientY);
      // Dentro il gesto: lo sheet torna su e iOS riapre la tastiera.
      flushSync(() => {
        setPunto(catturato);
        setPuntando(false);
      });
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPuntando(false);
    }
    const opzioni = { capture: true } as const;
    for (const tipo of ["pointerdown", "mousedown", "touchstart", "pointerup", "mouseup", "dblclick"]) {
      window.addEventListener(tipo, blocca, opzioni);
    }
    window.addEventListener("click", onClick, opzioni);
    window.addEventListener("keydown", onKey);
    return () => {
      for (const tipo of ["pointerdown", "mousedown", "touchstart", "pointerup", "mouseup", "dblclick"]) {
        window.removeEventListener(tipo, blocca, opzioni);
      }
      window.removeEventListener("click", onClick, opzioni);
      window.removeEventListener("keydown", onKey);
    };
  }, [puntando]);

  function apriDaSuggerimento() {
    const evento = suggerimentoRef.current;
    if (!evento) return;
    const stato = leggiLocale<StatoSuggerimento>(CHIAVE_SUGGERIMENTO, STATO_SUGGERIMENTO_INIZIALE);
    scriviLocale(CHIAVE_SUGGERIMENTO, dopoAccettato(stato));
    suggerimentoRef.current = null;
    apriFeedback({ origine: "suggerimento", tipo: "problema", attrito: evento, pagina: evento.pagina });
  }

  // --- Ciclo di verifica (solo owner: il tester non può rispondere) -------

  const caricaDaVerificare = useCallback(() => {
    void leggiJson<{ feedback: FeedbackDaVerificare[] }>("/api/feedback?stato=da-verificare", { feedback: [] }).then(
      ({ feedback }) => setDaVerificare(feedback)
    );
  }, []);

  useEffect(() => {
    if (!owner) return;
    caricaDaVerificare();
    registraDaVerificareCambiati(caricaDaVerificare);
    return () => registraDaVerificareCambiati(null);
  }, [owner, caricaDaVerificare]);

  // Arrivando su una pagina con un feedback da verificare: evidenzia il
  // punto indicato (2 s, se c'è) e poi l'avviso. Stesso aggancio per "Vai
  // al punto" dalla pagina /feedback.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const daEvidenziare = prendiEvidenziazione();
    if (daEvidenziare) timers.push(setTimeout(() => evidenziaPunto(daEvidenziare), ATTESA_PAGINA_MS));

    const candidato = daVerificare && !daEvidenziare ? daVerificareQui(daVerificare, paginaTemplate(pathname)) : null;
    if (candidato) {
      timers.push(
        setTimeout(() => {
          const contestoOk = () =>
            !aperturaRef.current &&
            !suggerimentoRef.current &&
            puoMostrareVerifica({
              mostratiInSessione: leggiSessione(CHIAVE_VERIFICHE_SESSIONE, 0),
              inSessioneAllenamento: inSessioneAllenamento(pathnameRef.current),
              campoConFocus: campoConFocus(),
              sheetAperto: sheetAperto(),
            });
          if (!contestoOk()) return;
          const mostra = () => {
            if (!contestoOk()) return;
            scriviSessione(CHIAVE_VERIFICHE_SESSIONE, leggiSessione(CHIAVE_VERIFICHE_SESSIONE, 0) + 1);
            setVerifica(candidato);
          };
          if (candidato.punto?.selettore && evidenziaPunto(candidato.punto.selettore, VERIFICA_EVIDENZIA_MS)) {
            timers.push(setTimeout(mostra, VERIFICA_EVIDENZIA_MS));
          } else {
            mostra();
          }
        }, ATTESA_PAGINA_MS)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [pathname, daVerificare]);

  // Ignorato: sparisce dopo 6 secondi e riappare alla prossima visita della
  // pagina in una nuova sessione (al massimo 1 avviso per sessione).
  useEffect(() => {
    if (!verifica) return;
    const timer = setTimeout(() => setVerifica(null), VERIFICA_DURATA_MS);
    return () => clearTimeout(timer);
  }, [verifica]);

  async function rispondiVerifica(risolto: boolean) {
    const f = verifica;
    if (!f) return;
    setVerifica(null);
    setDaVerificare((lista) => (lista ?? []).filter((x) => x.id !== f.id));
    if (risolto) {
      const esito = await segnaVerificato(f.id);
      setRicevuto((r) => ({ n: r.n + 1, messaggio: esito.ok ? "Grazie, segnato come sistemato." : esito.errore }));
      return;
    }
    // "No": il feedback torna in coda con priorità massima; lo sheet chiede
    // (facoltativo) cosa non va ancora.
    apriFeedback({ origine: "suggerimento", tipo: f.tipo, pagina: f.route, riapertoId: f.id });
    const esito = await segnaNonRisolto(f.id);
    if (!esito.ok) setRicevuto((r) => ({ n: r.n + 1, messaggio: esito.errore }));
  }

  const inBasso =
    "pointer-events-none fixed inset-x-0 bottom-[calc(var(--app-tabbar-height)+max(env(safe-area-inset-bottom),20px)+0.75rem)] z-40 flex justify-center px-4 md:bottom-6";

  return (
    <>
      {apertura && !puntando && (
        <FeedbackSheet
          bozza={bozza}
          onBozza={setBozza}
          onClose={chiudi}
          onInvia={invia}
          punto={etichettaPunto(punto)}
          onIndicaPunto={() => setPuntando(true)}
          onRimuoviPunto={() => setPunto(null)}
          aperti={aperti}
          notaPer={notaPer}
          onNotaPer={setNotaPer}
          riapertura={!!apertura.riapertoId}
        />
      )}

      {apertura && puntando && (
        <div
          data-fb-barra-punto
          className="app-static fixed inset-x-0 top-0 z-[60] flex items-center justify-between gap-3 bg-foreground px-4 pt-[max(env(safe-area-inset-top),0.5rem)] pb-2 text-background shadow-lg"
        >
          <span className="text-[15px] font-medium">Tocca l&apos;elemento</span>
          <button
            type="button"
            onClick={() => setPuntando(false)}
            className="min-h-[44px] px-2 text-[15px] font-semibold active:opacity-60"
          >
            Annulla
          </button>
        </div>
      )}

      {suggerimento && (
        <div className={inBasso}>
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

      {verifica && (
        <div className={inBasso}>
          <div
            role="status"
            className="app-static animate-slide-up pointer-events-auto flex w-full max-w-md flex-col gap-2 rounded-2xl bg-foreground px-4 py-3 text-background shadow-lg"
          >
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-entrata" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px] font-medium">Avevi segnalato un problema qui. È sistemato?</span>
                {verifica.nota_fix && <span className="line-clamp-2 text-[13px] opacity-80">{verifica.nota_fix}</span>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => void rispondiVerifica(false)}
                className="min-h-[36px] rounded-full px-4 text-[15px] font-medium opacity-90 active:opacity-60"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => void rispondiVerifica(true)}
                className="min-h-[36px] rounded-full bg-background px-4 text-[15px] font-semibold text-foreground active:opacity-80"
              >
                Sì
              </button>
            </div>
          </div>
        </div>
      )}

      {ricevuto.n > 0 && <Toast key={ricevuto.n} message={ricevuto.messaggio} />}
    </>
  );
}
