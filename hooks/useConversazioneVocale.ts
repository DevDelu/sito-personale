"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { OPZIONI_VAD, passoVad, rmsDa, statoIniziale, type StatoVad } from "@/lib/assistente/vad";
import { frasiPerVoce } from "@/lib/assistente/voce";
import { contestoAudio, sbloccaAudio } from "@/lib/assistente/audio";

// Motore della conversazione a voce di /assistente, tutto nel browser:
// microfono → rilevamento del parlato (lib/assistente/vad.ts) → registrazione
// della frase → POST /api/assistente/parla → lettura della risposta con la
// sintesi vocale di sistema → di nuovo in ascolto. Nessun servizio a
// pagamento: trascrizione e LLM su Groq lato server, voce del telefono.
//
// Su iPhone, con il microfono aperto, iOS manda l'audio nella capsula
// auricolare a volume basso: lì il microfono si chiude mentre Radar parla
// (si interrompe toccando il cerchio). Altrove resta aperto e si può
// interrompere parlando, con una soglia più alta per non sentire l'eco.

export type FaseVoce = "spento" | "avvio" | "ascolto" | "registro" | "penso" | "parlo";

export type RispostaTurno = {
  trascrizione: string | null;
  richiesta: string;
  risposta: string;
  bozze: { id: string; riepilogo: string }[];
  bozzeChiuse: { id: string; stato: "confermata" | "annullata" }[];
};

type Opzioni = {
  // Invia un turno (audio o testo) e restituisce la risposta, o null se
  // non c'era niente da capire. Fornita dal componente (gestisce la storia).
  invia: (dati: { audio?: Blob; nomeFile?: string; testo?: string }) => Promise<RispostaTurno | null>;
  onErrore: (messaggio: string) => void;
};

const TICK_MS = 50;
// In ascolto senza parlare: la registrazione riparte ogni tanto per non
// inviare minuti di silenzio quando finalmente si parla.
const RIAVVIO_SILENZIO_MS = 15_000;
const MOLTIPLICATORE_ECO = 3;

function scegliMime(): { mime: string; estensione: string } {
  const candidati: [string, string][] = [
    ["audio/webm;codecs=opus", "webm"],
    ["audio/mp4", "mp4"],
    ["audio/webm", "webm"],
  ];
  for (const [mime, estensione] of candidati) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) return { mime, estensione };
  }
  return { mime: "", estensione: "webm" };
}

const nessunaIscrizione = () => () => {};

function isIos(): boolean {
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function vocePreferita(): SpeechSynthesisVoice | null {
  const voci = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("it"));
  // Le voci "enhanced"/"premium" di iOS e quelle Google suonano meglio.
  return (
    voci.find((v) => /premium|enhanced|migliorata/i.test(v.name)) ??
    voci.find((v) => /google/i.test(v.name)) ??
    voci.find((v) => v.localService) ??
    voci[0] ??
    null
  );
}

export function useConversazioneVocale({ invia, onErrore }: Opzioni) {
  const [fase, setFase] = useState<FaseVoce>("spento");
  const [livello, setLivello] = useState(0);
  const [voceAttiva, setVoceAttiva] = useState(true);
  // Il server non sa cosa supporta il browser: rende "supportato" e il
  // client corregge dopo l'idratazione, senza mismatch.
  const supportato = useSyncExternalStore(
    nessunaIscrizione,
    () => !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined" && "speechSynthesis" in window,
    () => true
  );

  const faseRef = useRef<FaseVoce>("spento");
  const voceAttivaRef = useRef(true);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inizioRegistrazioneRef = useRef(0);
  const vadRef = useRef<StatoVad>(statoIniziale());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ultimoTickRef = useRef(0);
  const turnoVoceRef = useRef(0); // invalida gli onend di letture interrotte
  const mimeRef = useRef(scegliMime());
  const micDuranteRispostaRef = useRef(true);
  const inviaRef = useRef(invia);
  const onErroreRef = useRef(onErrore);

  useEffect(() => {
    inviaRef.current = invia;
    onErroreRef.current = onErrore;
  }, [invia, onErrore]);

  const cambiaFase = useCallback((f: FaseVoce) => {
    faseRef.current = f;
    setFase(f);
  }, []);

  // --- Registrazione -------------------------------------------------------

  const avviaRegistrazione = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const vecchio = recorderRef.current;
    if (vecchio && vecchio.state !== "inactive") {
      vecchio.ondataavailable = null;
      vecchio.onstop = null;
      vecchio.stop();
    }
    chunksRef.current = [];
    const { mime } = mimeRef.current;
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.start();
    recorderRef.current = rec;
    inizioRegistrazioneRef.current = performance.now();
  }, []);

  const fermaRegistrazione = useCallback((): Promise<Blob | null> => {
    const rec = recorderRef.current;
    recorderRef.current = null;
    if (!rec || rec.state === "inactive") return Promise.resolve(null);
    return new Promise((resolve) => {
      rec.onstop = () => resolve(new Blob(chunksRef.current, { type: rec.mimeType || mimeRef.current.mime }));
      rec.stop();
    });
  }, []);

  // --- Microfono -----------------------------------------------------------

  const apriMicrofono = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    streamRef.current = stream;
    // Contesto condiviso, sbloccato nel tap che ha aperto l'assistente
    // (lib/assistente/audio.ts): creato qui fuori da un gesto, su iOS
    // resterebbe sospeso e il microfono sembrerebbe muto.
    const ctx = audioCtxRef.current ?? contestoAudio() ?? sbloccaAudio() ?? new AudioContext();
    audioCtxRef.current = ctx;
    // Non si aspetta: fuori da un gesto, su iOS resume() può restare in
    // sospeso per sempre e bloccherebbe l'avvio.
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser);
    analyserRef.current = analyser;
    bufferRef.current = new Float32Array(analyser.fftSize);
    vadRef.current = statoIniziale();
  }, []);

  const chiudiMicrofono = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.ondataavailable = null;
      rec.onstop = null;
      rec.stop();
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
  }, []);

  const tornaInAscolto = useCallback(async () => {
    if (faseRef.current === "spento") return;
    try {
      if (!streamRef.current) await apriMicrofono();
      avviaRegistrazione();
      cambiaFase("ascolto");
    } catch {
      onErroreRef.current("Non riesco a riaprire il microfono.");
      cambiaFase("spento");
    }
  }, [apriMicrofono, avviaRegistrazione, cambiaFase]);

  // --- Voce in uscita ------------------------------------------------------

  const parla = useCallback(
    (testo: string) => {
      const frasi = frasiPerVoce(testo);
      if (!voceAttivaRef.current || frasi.length === 0) {
        void tornaInAscolto();
        return;
      }
      const turno = ++turnoVoceRef.current;
      if (!micDuranteRispostaRef.current) chiudiMicrofono();
      cambiaFase("parlo");
      const voce = vocePreferita();
      window.speechSynthesis.cancel();
      frasi.forEach((frase, i) => {
        const u = new SpeechSynthesisUtterance(frase);
        u.lang = "it-IT";
        u.rate = 1.05;
        if (voce) u.voice = voce;
        if (i === frasi.length - 1) {
          const fine = () => {
            if (turnoVoceRef.current === turno && faseRef.current === "parlo") void tornaInAscolto();
          };
          u.onend = fine;
          u.onerror = fine;
        }
        window.speechSynthesis.speak(u);
      });
    },
    [cambiaFase, chiudiMicrofono, tornaInAscolto]
  );

  const zittisci = useCallback(() => {
    turnoVoceRef.current++;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  // --- Un turno ------------------------------------------------------------

  const gestisciTurno = useCallback(
    async (dati: { audio?: Blob; nomeFile?: string; testo?: string }) => {
      cambiaFase("penso");
      try {
        const r = await inviaRef.current(dati);
        if (faseRef.current === "spento") return;
        if (!r) {
          void tornaInAscolto();
          return;
        }
        parla(r.risposta);
      } catch (e) {
        onErroreRef.current(e instanceof Error ? e.message : "Qualcosa è andato storto.");
        void tornaInAscolto();
      }
    },
    [cambiaFase, parla, tornaInAscolto]
  );

  const chiudiFrase = useCallback(async () => {
    const blob = await fermaRegistrazione();
    if (!blob || blob.size === 0) {
      void tornaInAscolto();
      return;
    }
    await gestisciTurno({ audio: blob, nomeFile: `voce.${mimeRef.current.estensione}` });
  }, [fermaRegistrazione, gestisciTurno, tornaInAscolto]);

  // --- Ciclo di ascolto ----------------------------------------------------

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    const buffer = bufferRef.current;
    const ora = performance.now();
    const dt = Math.min(ora - ultimoTickRef.current, 200);
    ultimoTickRef.current = ora;
    const f = faseRef.current;
    if (!analyser || !buffer || (f !== "ascolto" && f !== "registro" && f !== "parlo")) {
      setLivello(0);
      return;
    }
    analyser.getFloatTimeDomainData(buffer);
    const rms = rmsDa(buffer);
    setLivello(Math.min(1, rms * 12));

    const { stato, evento } = passoVad(vadRef.current, rms, dt, OPZIONI_VAD, f === "parlo" ? MOLTIPLICATORE_ECO : 1);
    vadRef.current = stato;

    if (evento === "inizio") {
      if (f === "parlo") {
        // Interrotto a voce: si smette di parlare e si registra subito.
        zittisci();
        avviaRegistrazione();
      }
      cambiaFase("registro");
    } else if (evento === "fine" && f === "registro") {
      void chiudiFrase();
    } else if (evento === "scarta" && f === "registro") {
      avviaRegistrazione();
      cambiaFase("ascolto");
    } else if (f === "ascolto" && ora - inizioRegistrazioneRef.current > RIAVVIO_SILENZIO_MS) {
      avviaRegistrazione();
    }
  }, [avviaRegistrazione, cambiaFase, chiudiFrase, zittisci]);

  // --- Comandi pubblici ----------------------------------------------------

  const ferma = useCallback(() => {
    cambiaFase("spento");
    zittisci();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    chiudiMicrofono();
    setLivello(0);
  }, [cambiaFase, chiudiMicrofono, zittisci]);

  // Va chiamata dentro un tap: iOS sblocca microfono, audio e sintesi
  // vocale solo a partire da un gesto dell'utente.
  const avvia = useCallback(async (): Promise<boolean> => {
    if (faseRef.current !== "spento") return false;
    cambiaFase("avvio");
    micDuranteRispostaRef.current = !isIos();
    // Sblocco di audio e sintesi vocale (no-op se già fatto nel tap che ha
    // aperto lo sheet).
    sbloccaAudio();
    try {
      await apriMicrofono();
    } catch {
      cambiaFase("spento");
      onErroreRef.current("Serve il permesso del microfono: abilitalo nelle impostazioni del browser.");
      return false;
    }
    ultimoTickRef.current = performance.now();
    timerRef.current = setInterval(tick, TICK_MS);
    avviaRegistrazione();
    cambiaFase("ascolto");
    return true;
  }, [apriMicrofono, avviaRegistrazione, cambiaFase, tick]);

  // Tap sul cerchio mentre Radar parla: basta così, tocca a me.
  const interrompi = useCallback(() => {
    if (faseRef.current !== "parlo") return;
    zittisci();
    void tornaInAscolto();
  }, [tornaInAscolto, zittisci]);

  // Domanda scritta: stesso giro, con risposta a voce solo se la
  // conversazione a voce è accesa.
  const inviaTesto = useCallback(
    async (testo: string) => {
      if (faseRef.current === "spento") {
        try {
          await inviaRef.current({ testo });
        } catch (e) {
          onErroreRef.current(e instanceof Error ? e.message : "Qualcosa è andato storto.");
        }
        return;
      }
      zittisci();
      await fermaRegistrazione();
      await gestisciTurno({ testo });
    },
    [fermaRegistrazione, gestisciTurno, zittisci]
  );

  // L'assistente parla per primo (es. "Cosa stavi facendo?" dopo un
  // errore), poi si mette in ascolto.
  const annuncia = useCallback(
    (testo: string) => {
      if (faseRef.current === "spento") return;
      zittisci();
      void fermaRegistrazione().then(() => parla(testo));
    },
    [fermaRegistrazione, parla, zittisci]
  );

  const cambiaVoce = useCallback(() => {
    voceAttivaRef.current = !voceAttivaRef.current;
    setVoceAttiva(voceAttivaRef.current);
    if (!voceAttivaRef.current && faseRef.current === "parlo") {
      zittisci();
      void tornaInAscolto();
    }
  }, [tornaInAscolto, zittisci]);

  // Uscita dalla pagina o app in background: si chiude tutto (iOS toglie
  // comunque il microfono alle pagine non visibili).
  useEffect(() => {
    const nascosta = () => {
      if (document.visibilityState === "hidden") ferma();
    };
    document.addEventListener("visibilitychange", nascosta);
    return () => {
      document.removeEventListener("visibilitychange", nascosta);
      ferma();
      // Il contesto audio è condiviso (audio.ts) e resta sbloccato per la
      // prossima apertura: non si chiude.
      audioCtxRef.current = null;
    };
  }, [ferma]);

  // Le voci di sistema arrivano in modo asincrono (Chrome): basta chiederle
  // una volta perché getVoices() sia pronto al momento di parlare.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.getVoices();
  }, []);

  return { fase, livello, voceAttiva, supportato, avvia, ferma, interrompi, inviaTesto, cambiaVoce, annuncia };
}
