"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Keyboard, Mic, MicOff, RotateCcw, Send, Volume2, VolumeX, X } from "lucide-react";
import { useConversazioneVocale, type FaseVoce, type RispostaTurno } from "@/hooks/useConversazioneVocale";
import { useWakeLock } from "@/hooks/useWakeLock";
import { MAX_TURNI, type Turno } from "@/lib/assistente/storia";

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
  ascolto: "Ti ascolto",
  registro: "Ti ascolto…",
  penso: "Ci penso…",
  parlo: "Tocca per interrompere",
};

let prossimoId = 1;

export function ParlaConRadar() {
  const [messaggi, setMessaggi] = useState<Messaggio[]>([]);
  const [errore, setErrore] = useState<string | null>(null);
  const [tastiera, setTastiera] = useState(false);
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
    [aggiungi, aggiornaBozze]
  );

  const voce = useConversazioneVocale({ invia, onErrore: setErrore });
  const attiva = voce.fase !== "spento";
  useWakeLock(attiva);

  useEffect(() => {
    fondoRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messaggi, voce.fase]);

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
    <div className="flex min-h-[calc(100dvh-12rem)] flex-1 flex-col md:min-h-[70vh]">
      <div data-fb-area="assistente.conversazione" className="flex flex-1 flex-col gap-3 pb-4">
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
                  className="rounded-full border border-border px-3 py-1.5 text-[13px] text-muted active:bg-surface-hover"
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
                      ? "max-w-[85%] rounded-2xl rounded-br-md bg-accent/15 px-3.5 py-2 text-[15px]"
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
              <li className="flex items-center gap-1.5 px-1 text-muted" aria-label="Sto pensando">
                <span className="h-2 w-2 animate-pulse rounded-full bg-muted" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
              </li>
            ) : null}
          </ul>
        )}
        <div ref={fondoRef} />
      </div>

      <div
        data-fb-area="assistente.controlli"
        // Sopra la tab bar su mobile (stesso calcolo di ActionBar), in linea su desktop.
        style={{ bottom: "calc(var(--app-tabbar-height) + env(safe-area-inset-bottom))" }}
        className="sticky z-20 -mx-4 flex flex-col items-center gap-3 border-t border-[var(--app-hairline)] bg-background/95 px-4 pb-3 pt-4 backdrop-blur md:static md:mx-0 md:rounded-2xl md:border"
      >
        {errore ? (
          <p role="alert" className="text-center text-sm text-spesa">
            {errore}
          </p>
        ) : null}
        {!voce.supportato ? (
          <p className="text-center text-sm text-muted">Questo browser non supporta la voce: puoi scrivere.</p>
        ) : null}

        {tastiera || !voce.supportato ? (
          <form onSubmit={inviaScritto} className="flex w-full items-center gap-2">
            <input
              value={bozza}
              onChange={(e) => setBozza(e.target.value)}
              placeholder="Scrivi a Radar…"
              enterKeyHint="send"
              className="min-h-11 flex-1 rounded-full border border-border bg-surface px-4 text-[16px] outline-none focus:border-accent"
              aria-label="Messaggio"
            />
            <button type="submit" className="btn-primary !px-3" aria-label="Invia" disabled={!bozza.trim()}>
              <Send className="h-4 w-4" />
            </button>
          </form>
        ) : null}

        <div className="flex w-full items-center justify-between">
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
            <button
              type="button"
              className="btn-icon"
              onClick={() => setTastiera((t) => !t)}
              aria-label="Scrivi invece di parlare"
              aria-pressed={tastiera}
            >
              <Keyboard className="h-5 w-5" />
            </button>
          </div>

          {voce.supportato ? (
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={tapCerchio}
                aria-label={ETICHETTE[voce.fase]}
                className={`relative flex h-20 w-20 items-center justify-center rounded-full text-accent-foreground shadow-lg transition-colors ${
                  attiva ? "bg-accent" : "bg-accent/85"
                } ${voce.fase === "penso" ? "animate-pulse" : ""}`}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-accent/30 transition-transform duration-75"
                  style={{ transform: `scale(${scala * 1.25})` }}
                />
                <Mic className="relative h-8 w-8" strokeWidth={2} />
              </button>
              <span className="text-xs text-muted" aria-live="polite">
                {ETICHETTE[voce.fase]}
              </span>
            </div>
          ) : (
            <span />
          )}

          <div className="flex gap-1">
            {attiva ? (
              <button type="button" className="btn-icon" onClick={voce.ferma} aria-label="Chiudi il microfono">
                <MicOff className="h-5 w-5" />
              </button>
            ) : null}
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
