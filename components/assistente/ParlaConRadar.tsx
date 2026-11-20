"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Mic, RotateCcw, Send, Square, Volume2, VolumeX, X } from "lucide-react";
import { useConversazioneVocale, type FaseVoce, type RispostaTurno } from "@/hooks/useConversazioneVocale";
import { useWakeLock } from "@/hooks/useWakeLock";
import { MAX_TURNI, type Turno } from "@/lib/assistente/storia";
import type { AttritoEvento } from "@/lib/feedback/types";

type StatoBozza = "in_attesa" | "confermata" | "annullata" | "invio";
type Bozza = { id: string; riepilogo: string; stato: StatoBozza };
type Messaggio = { id: number; ruolo: "user" | "assistant"; testo: string; bozze?: Bozza[] };

const ESEMPI = [
  "Quanto ho speso questo mese?",
  "Ho speso 12 euro al bar",
  "Come va il portafoglio?",
  "Quante calorie ho mangiato oggi?",
];

const ETICHETTE: Record<FaseVoce, string> = {
  spento: "Tocca per parlare",
  avvio: "Apro il microfono…",
  ascolto: "Ti ascolto · tocca per fermare",
  registro: "Ti ascolto… · tocca per fermare",
  penso: "Ci penso… · tocca per fermare",
  parlo: "Tocca per interrompere",
};

let prossimoId = 1;

type Props = {
  // Pagina da cui è stato aperto l'assistente (pulsante centrale): va con
  // ogni turno, così un feedback detto a voce sa a quale pagina si riferisce.
  pagina?: string;
  // Errore che ha fatto comparire l'invito "Qualcosa non va?": l'assistente
  // apre chiedendo cosa è successo.
  attrito?: AttritoEvento;
  // Dentro lo sheet si mette in ascolto da solo (il tap sul pulsante che
  // l'ha aperto ha già sbloccato l'audio).
  avvioAutomatico?: boolean;
  inSheet?: boolean;
};

const DOMANDA_ATTRITO = "Ho visto che qualcosa non è andato. Cosa stavi facendo? Raccontamelo e lo passo al team.";

export function ParlaConRadar({ pagina, attrito, avvioAutomatico = false, inSheet = false }: Props = {}) {
  const [messaggi, setMessaggi] = useState<Messaggio[]>([]);
  const [errore, setErrore] = useState<string | null>(null);
  const [bozza, setBozza] = useState("");
  const storiaRef = useRef<Turno[]>([]);
  const fondoRef = useRef<HTMLDivElement>(null);

  const aggiungi = useCallback((m: Omit<Messaggio, "id">) => {
    setMessaggi((prev) => [...prev, { ...m, id: prossimoId++ }]);
  }, []);

  const aggiornaBozze = useCallback((ids: Map<string, StatoBozza>) => {
    setMessaggi((prev) =>
      prev.map((m) =>
        m.bozze?.some((b) => ids.has(b.id))
          ? { ...m, bozze: m.bozze.map((b) => (ids.has(b.id) ? { ...b, stato: ids.get(b.id)! } : b)) }
          : m
      )
    );
  }, []);

  const invia = useCallback(
    async (dati: { audio?: Blob; nomeFile?: string; testo?: string }): Promise<RispostaTurno | null> => {
      setErrore(null);
      const form = new FormData();
      if (dati.audio) form.append("audio", dati.audio, dati.nomeFile ?? "voce.webm");
      if (dati.testo) {
        form.append("testo", dati.testo);
        aggiungi({ ruolo: "user", testo: dati.testo });
      }
      form.append("storia", JSON.stringify(storiaRef.current));
      if (pagina) form.append("pagina", pagina);
      if (attrito) form.append("attrito", JSON.stringify(attrito));

      const res = await fetch("/api/assistente/parla", { method: "POST", body: form });
      const json = (await res.json().catch(() => ({}))) as Partial<RispostaTurno> & { error?: string; vuoto?: boolean };
      if (!res.ok) throw new Error(json.error ?? "Qualcosa è andato storto.");
      if (json.vuoto || !json.risposta || !json.richiesta) return null;

      const r = json as RispostaTurno;
      if (r.trascrizione) aggiungi({ ruolo: "user", testo: r.trascrizione });
      aggiungi({
        ruolo: "assistant",
        testo: r.risposta,
        bozze: r.bozze.map((b) => ({ ...b, stato: "in_attesa" as const })),
      });
      if (r.bozzeChiuse.length) aggiornaBozze(new Map(r.bozzeChiuse.map((b) => [b.id, b.stato])));
      storiaRef.current = [
        ...storiaRef.current,
        { role: "user" as const, content: r.richiesta },
        { role: "assistant" as const, content: r.risposta },
      ].slice(-MAX_TURNI);
      return r;
    },
    [aggiungi, aggiornaBozze, pagina, attrito]
  );

  const voce = useConversazioneVocale({ invia, onErrore: setErrore });
  const attiva = voce.fase !== "spento";
  // iOS non riduce dvh quando si apre la tastiera: nello sheet l'altezza segue
  // il viewport visibile, così la barra di scrittura resta sopra la tastiera.
  const [altezzaVisibile, setAltezzaVisibile] = useState<number | null>(null);
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!inSheet || !vv) return;
    const aggiorna = () => setAltezzaVisibile(Math.round(vv.height));
    aggiorna();
    vv.addEventListener("resize", aggiorna);
    return () => vv.removeEventListener("resize", aggiorna);
  }, [inSheet]);
  useWakeLock(attiva);

  useEffect(() => {
    fondoRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messaggi, voce.fase]);

  // Avvio automatico (sheet): una volta sola, anche col doppio effetto di
  // React in sviluppo.
  const avviatoRef = useRef(false);
  const { avvia, annuncia } = voce;
  useEffect(() => {
    if (!avvioAutomatico || avviatoRef.current) return;
    avviatoRef.current = true;
    async function parti() {
      const ok = await avvia();
      if (!attrito) return;
      aggiungi({ ruolo: "assistant", testo: DOMANDA_ATTRITO });
      storiaRef.current = [{ role: "assistant", content: DOMANDA_ATTRITO }];
      if (ok) annuncia(DOMANDA_ATTRITO);
    }
    void parti();
  }, [avvioAutomatico, attrito, avvia, annuncia, aggiungi]);

  async function gestisciBozza(id: string, azione: "conferma" | "annulla") {
    aggiornaBozze(new Map([[id, "invio"]]));
    const res = await fetch(`/api/assistente/bozze/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ azione }),
    }).catch(() => null);
    const json = (await res?.json().catch(() => ({}))) as { stato?: StatoBozza; error?: string } | undefined;
    if (res?.ok && json?.stato) aggiornaBozze(new Map([[id, json.stato]]));
    else {
      aggiornaBozze(new Map([[id, res?.status === 409 ? "confermata" : "in_attesa"]]));
      if (res?.status !== 409) setErrore(json?.error ?? "Non sono riuscito a salvarla, riprova.");
    }
  }

  function tapCerchio() {
    if (voce.fase === "spento") void voce.avvia();
    else if (voce.fase === "parlo") voce.interrompi();
    else voce.ferma();
  }

  function nuovaConversazione() {
    voce.ferma();
    storiaRef.current = [];
    setMessaggi([]);
    setErrore(null);
  }

  function inviaScritto(e: React.FormEvent) {
    e.preventDefault();
    const testo = bozza.trim();
    if (!testo) return;
    setBozza("");
    void voce.inviaTesto(testo);
  }

  const scala = 1 + (voce.fase === "ascolto" || voce.fase === "registro" ? voce.livello * 0.35 : 0);

  return (
    <div
      style={inSheet && altezzaVisibile ? { maxHeight: altezzaVisibile - 16 } : undefined}
      className={
        inSheet
          ? "flex h-[min(78dvh,680px)] flex-col"
          : "flex min-h-[calc(100dvh-12rem)] flex-1 flex-col md:min-h-[70vh]"
      }
    >
      <div
        data-fb-area="assistente.conversazione"
        className={`flex flex-1 flex-col gap-3 pb-4 ${inSheet ? "min-h-0 overflow-y-auto overscroll-contain px-4 pt-2" : ""}`}
        // Nello sheet il pannello si chiude trascinandolo in giù: scorrendo la
        // conversazione non deve partire il trascinamento (si chiude dal
        // grabber, dai controlli o col tocco fuori).
        onPointerDown={inSheet ? (e) => e.stopPropagation() : undefined}
      >
        {messaggi.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6 text-center">
            <p className="max-w-xs text-sm text-muted">
              Parla come faresti con una persona: spese da segnare, domande sui tuoi numeri, idee per migliorare Radar.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {ESEMPI.map((es) => (
                <button
                  key={es}
                  type="button"
                  className="min-h-11 rounded-full border border-border px-4 text-[13px] text-muted active:bg-surface-hover"
                  onClick={() => void voce.inviaTesto(es)}
                >
                  {es}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3" aria-live="polite">
            {messaggi.map((m) => (
              <li key={m.id} className={m.ruolo === "user" ? "flex justify-end" : "flex flex-col items-start gap-2"}>
                <p
                  className={
                    m.ruolo === "user"
                      ? "importo max-w-[85%] rounded-2xl rounded-br-md bg-accent/15 px-3.5 py-2 text-[15px]"
                      : "importo max-w-[90%] whitespace-pre-line rounded-2xl rounded-bl-md bg-surface px-3.5 py-2 text-[15px] shadow-sm"
                  }
                >
                  {m.testo}
                </p>
                {m.bozze?.map((b) => (
                  <div
                    key={b.id}
                    data-fb-area="assistente.bozza"
                    className="w-full max-w-[90%] rounded-2xl border border-border bg-surface p-3 text-sm"
                  >
                    <p className="importo whitespace-pre-line">{b.riepilogo}</p>
                    {b.stato === "confermata" ? (
                      <p className="mt-2 flex items-center gap-1 text-entrata">
                        <Check className="h-4 w-4" /> Salvata
                      </p>
                    ) : b.stato === "annullata" ? (
                      <p className="mt-2 text-muted">Annullata</p>
                    ) : (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={b.stato === "invio"}
                          onClick={() => void gestisciBozza(b.id, "conferma")}
                        >
                          <Check className="h-4 w-4" /> Conferma
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={b.stato === "invio"}
                          onClick={() => void gestisciBozza(b.id, "annulla")}
                        >
                          <X className="h-4 w-4" /> Annulla
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </li>
            ))}
            {voce.fase === "penso" ? (
              <li className="flex items-center gap-1.5 px-1 text-muted">
                <span className="sr-only">Sto pensando</span>
                <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-muted" />
                <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
                <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
              </li>
            ) : null}
          </ul>
        )}
        <div ref={fondoRef} />
      </div>

      <div
        data-fb-area="assistente.controlli"
        // Pagina: sopra la tab bar su mobile (stesso calcolo di ActionBar), in
        // linea su desktop. Sheet: in fondo al pannello, che copre la tab bar.
        style={inSheet ? undefined : { bottom: "calc(var(--app-tabbar-height) + max(env(safe-area-inset-bottom), 20px))" }}
        className={
          inSheet
            ? "flex shrink-0 flex-col items-center gap-3 border-t border-[var(--app-hairline)] px-4 pb-3 pt-4"
            : "sticky z-20 -mx-4 flex flex-col items-center gap-3 border-t border-[var(--app-hairline)] bg-background/95 px-4 pb-3 pt-4 backdrop-blur md:static md:mx-0 md:rounded-2xl md:border"
        }
      >
        {errore ? (
          <p role="alert" className="text-center text-sm text-spesa">
            {errore}
          </p>
        ) : null}
        {!voce.supportato ? (
          <p className="text-center text-sm text-muted">Questo browser non supporta la voce: puoi scrivere.</p>
        ) : null}

        <form onSubmit={inviaScritto} className="flex w-full items-center gap-2">
          <input
            value={bozza}
            onChange={(e) => setBozza(e.target.value)}
            // Scrivere e parlare insieme non ha senso: toccando la barra il
            // microfono si chiude (su iOS la tastiera si apre dal tocco).
            onFocus={() => {
              if (voce.fase === "ascolto" || voce.fase === "registro") voce.ferma();
            }}
            placeholder="Scrivi a Radar…"
            enterKeyHint="send"
            className="min-h-11 flex-1 rounded-full border border-border bg-surface px-4 text-[16px] outline-none focus:border-accent"
            aria-label="Messaggio"
          />
          <button type="submit" className="btn-primary min-w-11 !px-3" aria-label="Invia" disabled={!bozza.trim()}>
            <Send className="h-4 w-4" />
          </button>
        </form>

        {/* Tre colonne: il cerchio resta fermo qualunque pulsante compaia ai lati. */}
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex gap-1">
            <button
              type="button"
              className="btn-icon"
              onClick={voce.cambiaVoce}
              aria-label={voce.voceAttiva ? "Disattiva le risposte a voce" : "Attiva le risposte a voce"}
              aria-pressed={voce.voceAttiva}
            >
              {voce.voceAttiva ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          </div>

          {voce.supportato ? (
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={tapCerchio}
                aria-label={ETICHETTE[voce.fase]}
                className={`relative flex h-20 w-20 items-center justify-center rounded-full text-accent-foreground shadow-lg transition-colors ${
                  attiva ? "bg-spesa" : "bg-accent/85"
                } ${voce.fase === "penso" ? "animate-pulse" : ""}`}
              >
                <span
                  aria-hidden
                  className={`absolute inset-0 rounded-full transition-transform duration-75 ${attiva ? "bg-spesa/30" : "bg-accent/30"}`}
                  style={{ transform: `scale(${scala * 1.25})` }}
                />
                {attiva ? (
                  <Square className="relative h-7 w-7 fill-current" strokeWidth={2} />
                ) : (
                  <Mic className="relative h-8 w-8" strokeWidth={2} />
                )}
              </button>
              <span className="text-center text-xs text-muted" aria-live="polite">
                {ETICHETTE[voce.fase]}
              </span>
            </div>
          ) : (
            <span />
          )}

          <div className="flex justify-end gap-1">
            <button
              type="button"
              className="btn-icon"
              onClick={nuovaConversazione}
              aria-label="Nuova conversazione"
              disabled={messaggi.length === 0 && !attiva}
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
