// Rilevamento del parlato (VAD) a energia, puro: il componente gli passa il
// volume RMS del microfono a ogni frame e riceve "inizio"/"fine". La soglia
// segue il rumore di fondo (stanza silenziosa vs strada), con un minimo
// fisso. Durante la risposta vocale si alza la soglia (fattoreParla) per
// non scambiare l'eco dell'altoparlante per Lorenzo che interrompe.

export type OpzioniVad = {
  sogliaMinima: number; // RMS 0..1
  fattoreRumore: number; // soglia = max(minima, rumore × fattore)
  inizioMs: number; // voce continua necessaria per dire "inizio"
  fineMs: number; // silenzio necessario per dire "fine"
  minParlatoMs: number; // sotto questa durata è un rumore, non una frase
  maxParlatoMs: number; // frase troppo lunga: si chiude comunque
  calibrazioneMs: number; // all'avvio si misura solo il rumore di fondo
};

export const OPZIONI_VAD: OpzioniVad = {
  sogliaMinima: 0.012,
  fattoreRumore: 3,
  inizioMs: 180,
  fineMs: 900,
  minParlatoMs: 450,
  maxParlatoMs: 60_000,
  calibrazioneMs: 600,
};

export type StatoVad = {
  parlando: boolean;
  msSopra: number;
  msSotto: number;
  msParlato: number;
  rumore: number;
  msTotali: number;
};

export type EventoVad = "inizio" | "fine" | "scarta" | null;

export function statoIniziale(): StatoVad {
  return { parlando: false, msSopra: 0, msSotto: 0, msParlato: 0, rumore: 0.005, msTotali: 0 };
}

export function soglia(s: StatoVad, o: OpzioniVad, moltiplicatore = 1): number {
  return Math.max(o.sogliaMinima, s.rumore * o.fattoreRumore) * moltiplicatore;
}

export function passoVad(
  s: StatoVad,
  rms: number,
  dtMs: number,
  o: OpzioniVad = OPZIONI_VAD,
  moltiplicatore = 1
): { stato: StatoVad; evento: EventoVad } {
  const n = { ...s, msTotali: s.msTotali + dtMs };
  // Calibrazione: il primo mezzo secondo serve solo a stimare il rumore di
  // fondo, così in strada la soglia parte già alta.
  if (s.msTotali < o.calibrazioneMs) {
    n.rumore = s.msTotali === 0 ? rms : n.rumore * 0.7 + rms * 0.3;
    return { stato: n, evento: null };
  }
  const sopra = rms > soglia(s, o, moltiplicatore);

  if (!n.parlando) {
    // Il rumore di fondo si aggiorna solo nel silenzio, lentamente.
    if (!sopra) n.rumore = n.rumore * 0.97 + rms * 0.03;
    n.msSopra = sopra ? n.msSopra + dtMs : 0;
    if (n.msSopra >= o.inizioMs) {
      return { stato: { ...n, parlando: true, msParlato: n.msSopra, msSotto: 0, msSopra: 0 }, evento: "inizio" };
    }
    return { stato: n, evento: null };
  }

  n.msParlato += dtMs;
  n.msSotto = sopra ? 0 : n.msSotto + dtMs;
  if (n.msSotto >= o.fineMs || n.msParlato >= o.maxParlatoMs) {
    const voce = n.msParlato - n.msSotto;
    const chiuso = { ...n, parlando: false, msParlato: 0, msSotto: 0, msSopra: 0 };
    return { stato: chiuso, evento: voce >= o.minParlatoMs ? "fine" : "scarta" };
  }
  return { stato: n, evento: null };
}

export function rmsDa(campioni: Float32Array): number {
  let somma = 0;
  for (let i = 0; i < campioni.length; i++) somma += campioni[i] * campioni[i];
  return Math.sqrt(somma / Math.max(campioni.length, 1));
}
