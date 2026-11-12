// Grafici didattici della Scuola di trading. I dati sono SINTETICI e
// deterministici: ogni scenario è una sequenza di punti chiave (indice,
// prezzo) da cui si generano candele realistiche con rumore a seme fisso.
// Così ogni lezione mostra esattamente il pattern che spiega (un doppio
// minimo vero, una rottura con volumi...), senza API a pagamento né dati
// di mercato da aggiornare, e i livelli disegnati coincidono con i dati.

import type { Candela } from "./indicatori.ts";

// [indice, prezzo] oppure [indice, prezzo, volatilità relativa del tratto
// che parte da questo punto] (1 = normale, 0.3 = compressione).
export type PuntoChiave = [number, number] | [number, number, number];

export type Livello = { prezzo: number; etichetta: string; tipo: "supporto" | "resistenza" | "neutro" };
export type LineaGuida = { da: [number, number]; a: [number, number]; etichetta: string; tipo: "supporto" | "resistenza" };

export type Scenario = {
  id: string;
  titolo: string;
  punti: PuntoChiave[];
  seme: number;
  volatilita?: number;
  // Indici in cui i volumi esplodono (rotture, capitolazioni).
  piccoVolumi?: number[];
  livelli?: Livello[];
  trendline?: LineaGuida[];
  // Movimento su cui tracciare i ritracciamenti: indici di minimo e massimo.
  fibonacci?: { minimo: number; massimo: number };
  annotazioni?: { indice: number; testo: string }[];
};

// Generatore pseudo-casuale con seme (mulberry32): stessi dati a ogni visita.
export function generatoreCasuale(seme: number) {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussiana(casuale: () => number) {
  const u = Math.max(casuale(), 1e-9);
  const v = casuale();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function generaCandele(punti: PuntoChiave[], seme: number, volatilita = 0.011, piccoVolumi: number[] = []): Candela[] {
  const casuale = generatoreCasuale(seme);
  const ultimo = punti[punti.length - 1][0];
  const candele: Candela[] = [];
  let rumore = 0;
  let chiusuraPrec = punti[0][1];

  for (let i = 0; i <= ultimo; i++) {
    // Tratto tra due punti chiave che contiene i.
    let s = 0;
    while (s < punti.length - 2 && punti[s + 1][0] <= i) s++;
    const [i0, p0, v0 = 1] = punti[s];
    const [i1, p1] = punti[s + 1];
    const t = i1 === i0 ? 1 : (i - i0) / (i1 - i0);
    const percorso = p0 + (p1 - p0) * t;
    const vol = volatilita * v0;

    // Rumore autocorrelato attenuato vicino ai punti chiave, così il
    // prezzo tocca davvero i livelli che la lezione disegna.
    const vicinanza = Math.min(Math.abs(i - i0), Math.abs(i1 - i)) / Math.max(1, (i1 - i0) / 2);
    rumore = 0.55 * rumore + gaussiana(casuale) * vol;
    const close = i === 0 ? p0 : percorso * (1 + rumore * Math.min(1, vicinanza + 0.15));
    const open = i === 0 ? p0 * (1 - vol / 2) : chiusuraPrec * (1 + gaussiana(casuale) * vol * 0.25);
    const high = Math.max(open, close) * (1 + Math.abs(gaussiana(casuale)) * vol * 0.6);
    const low = Math.min(open, close) * (1 - Math.abs(gaussiana(casuale)) * vol * 0.6);
    const movimento = Math.abs(close - chiusuraPrec) / chiusuraPrec;
    const picco = piccoVolumi.some((p) => Math.abs(p - i) <= 1) ? 2.6 : 1;
    const volume = Math.round(1_000_000 * (0.7 + casuale() * 0.6 + movimento * 25) * picco * (0.6 + v0 * 0.4));

    candele.push({ open, high, low, close, volume });
    chiusuraPrec = close;
  }
  return candele;
}

export const SCENARI: Record<string, Scenario> = {
  rialzo: {
    id: "rialzo",
    titolo: "Trend rialzista: massimi e minimi crescenti",
    seme: 11,
    punti: [[0, 100], [15, 112], [22, 106], [38, 122], [46, 115], [62, 134], [70, 127], [90, 148]],
    trendline: [{ da: [22, 106], a: [46, 115], etichetta: "Trendline rialzista", tipo: "supporto" }],
    annotazioni: [
      { indice: 22, testo: "Minimo 1" },
      { indice: 46, testo: "Minimo 2 (più alto)" },
      { indice: 70, testo: "Minimo 3 (più alto)" },
    ],
  },
  ribasso: {
    id: "ribasso",
    titolo: "Trend ribassista: massimi e minimi decrescenti",
    seme: 23,
    punti: [[0, 150], [14, 136], [22, 143], [38, 125], [46, 132], [62, 112], [70, 119], [90, 98]],
    trendline: [{ da: [22, 143], a: [46, 132], etichetta: "Trendline ribassista", tipo: "resistenza" }],
  },
  laterale: {
    id: "laterale",
    titolo: "Laterale e rottura: la resistenza diventa supporto",
    seme: 7,
    punti: [[0, 110], [10, 119.5], [20, 101], [30, 119.5], [40, 100.5], [50, 119.5], [60, 101.5], [70, 119], [80, 132], [88, 121], [100, 136]],
    piccoVolumi: [76, 77, 78],
    livelli: [
      { prezzo: 120, etichetta: "Resistenza 120", tipo: "resistenza" },
      { prezzo: 100, etichetta: "Supporto 100", tipo: "supporto" },
    ],
    annotazioni: [
      { indice: 77, testo: "Rottura con volumi" },
      { indice: 88, testo: "Retest" },
    ],
  },
  incrocio: {
    id: "incrocio",
    titolo: "Dal ribasso alla ripresa: incroci tra medie",
    seme: 5,
    volatilita: 0.012,
    punti: [[0, 120], [60, 150], [120, 118], [170, 100], [215, 126], [290, 168]],
  },
  "doppio-minimo": {
    id: "doppio-minimo",
    titolo: "Doppio minimo",
    seme: 31,
    punti: [[0, 132], [20, 100], [32, 115], [45, 100.5], [60, 114.5], [68, 124], [76, 117], [95, 138]],
    piccoVolumi: [62, 63],
    livelli: [
      { prezzo: 115, etichetta: "Neckline 115", tipo: "resistenza" },
      { prezzo: 100, etichetta: "Doppio minimo 100", tipo: "supporto" },
    ],
  },
  "testa-spalle": {
    id: "testa-spalle",
    titolo: "Testa e spalle",
    seme: 41,
    punti: [[0, 98], [16, 120], [26, 110], [42, 135], [55, 110.5], [70, 121], [80, 110], [90, 98], [96, 104], [110, 90]],
    piccoVolumi: [82, 83],
    livelli: [{ prezzo: 110, etichetta: "Neckline 110", tipo: "supporto" }],
    annotazioni: [
      { indice: 16, testo: "Spalla sx" },
      { indice: 42, testo: "Testa" },
      { indice: 70, testo: "Spalla dx" },
    ],
  },
  triangolo: {
    id: "triangolo",
    titolo: "Triangolo ascendente",
    seme: 17,
    punti: [[0, 100], [10, 119.5], [20, 105], [30, 119.5], [38, 110], [46, 119.5], [52, 114], [58, 119.5], [62, 116], [72, 132]],
    piccoVolumi: [64, 65],
    livelli: [{ prezzo: 120, etichetta: "Resistenza piatta 120", tipo: "resistenza" }],
    trendline: [{ da: [20, 105], a: [38, 110], etichetta: "Minimi crescenti", tipo: "supporto" }],
  },
  divergenza: {
    id: "divergenza",
    titolo: "Eccesso di ribasso e divergenza",
    seme: 13,
    punti: [[0, 150], [16, 113], [26, 124], [46, 109], [62, 128], [85, 140]],
    annotazioni: [
      { indice: 16, testo: "Minimo 1" },
      { indice: 46, testo: "Minimo 2 più basso" },
    ],
  },
  squeeze: {
    id: "squeeze",
    titolo: "Compressione di volatilità ed esplosione",
    seme: 3,
    punti: [[0, 100, 1.1], [20, 110, 1], [30, 106, 0.22], [58, 107.5, 0.22], [62, 108, 1.5], [75, 124, 1.1], [95, 130]],
    piccoVolumi: [62, 63, 64],
  },
  fibonacci: {
    id: "fibonacci",
    titolo: "Impulso, ritracciamento, ripartenza",
    seme: 19,
    punti: [[0, 101], [8, 100], [32, 150], [50, 119.5], [56, 124], [60, 120], [85, 162]],
    fibonacci: { minimo: 8, massimo: 32 },
  },
  rischio: {
    id: "rischio",
    titolo: "Un setup con stop e target",
    seme: 29,
    punti: [[0, 92], [18, 108], [30, 100.5], [40, 107], [48, 101], [55, 109], [75, 121]],
    livelli: [
      { prezzo: 109, etichetta: "Ingresso 109", tipo: "neutro" },
      { prezzo: 99.5, etichetta: "Stop 99,5", tipo: "supporto" },
      { prezzo: 128, etichetta: "Target 128 (2R)", tipo: "resistenza" },
    ],
  },
};

// Scenario casuale per il laboratorio: regimi di trend alternati.
export function scenarioCasuale(seme: number): Scenario {
  const casuale = generatoreCasuale(seme);
  const punti: PuntoChiave[] = [[0, 100]];
  let indice = 0;
  let prezzo = 100;
  while (indice < 140) {
    indice += 6 + Math.floor(casuale() * 14);
    prezzo = Math.max(30, prezzo * (1 + (casuale() - 0.47) * 0.22));
    punti.push([indice, Math.round(prezzo * 100) / 100, 0.6 + casuale() * 0.9]);
  }
  return { id: `casuale-${seme}`, titolo: "Grafico casuale", seme, punti };
}

export function candeleScenario(s: Scenario): Candela[] {
  return generaCandele(s.punti, s.seme, s.volatilita, s.piccoVolumi);
}
