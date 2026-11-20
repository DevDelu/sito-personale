// Indicatori di analisi tecnica calcolati su serie di prezzi. Funzioni pure,
// senza dipendenze: usate dai grafici della Scuola di trading e testate in
// indicatori.test.ts. Dove l'indicatore non ha ancora abbastanza dati il
// valore è null (il grafico non disegna quel tratto).

export type Candela = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Serie = (number | null)[];

// Media mobile semplice: media aritmetica degli ultimi `periodo` valori.
export function sma(valori: number[], periodo: number): Serie {
  const out: Serie = [];
  let somma = 0;
  for (let i = 0; i < valori.length; i++) {
    somma += valori[i];
    if (i >= periodo) somma -= valori[i - periodo];
    out.push(i >= periodo - 1 ? somma / periodo : null);
  }
  return out;
}

// Media mobile esponenziale: pesa di più i valori recenti
// (k = 2 / (periodo + 1)), parte dalla SMA dei primi `periodo` valori.
export function ema(valori: number[], periodo: number): Serie {
  const out: Serie = [];
  const k = 2 / (periodo + 1);
  let prec: number | null = null;
  for (let i = 0; i < valori.length; i++) {
    if (i < periodo - 1) {
      out.push(null);
      continue;
    }
    if (prec === null) {
      let s = 0;
      for (let j = i - periodo + 1; j <= i; j++) s += valori[j];
      prec = s / periodo;
    } else {
      prec = valori[i] * k + prec * (1 - k);
    }
    out.push(prec);
  }
  return out;
}

// RSI di Wilder: rapporto tra rialzi e ribassi medi, scalato 0-100.
export function rsi(valori: number[], periodo = 14): Serie {
  const out: Serie = [null];
  let mediaSu = 0;
  let mediaGiu = 0;
  for (let i = 1; i < valori.length; i++) {
    const d = valori[i] - valori[i - 1];
    const su = Math.max(d, 0);
    const giu = Math.max(-d, 0);
    if (i <= periodo) {
      mediaSu += su / periodo;
      mediaGiu += giu / periodo;
      if (i < periodo) {
        out.push(null);
        continue;
      }
    } else {
      mediaSu = (mediaSu * (periodo - 1) + su) / periodo;
      mediaGiu = (mediaGiu * (periodo - 1) + giu) / periodo;
    }
    out.push(mediaGiu === 0 ? 100 : 100 - 100 / (1 + mediaSu / mediaGiu));
  }
  return out;
}

export type Macd = { macd: Serie; segnale: Serie; istogramma: Serie };

// MACD: EMA veloce − EMA lenta; linea segnale = EMA della linea MACD.
export function macd(valori: number[], veloce = 12, lenta = 26, periodoSegnale = 9): Macd {
  const ev = ema(valori, veloce);
  const el = ema(valori, lenta);
  const linea: Serie = valori.map((_, i) => (ev[i] !== null && el[i] !== null ? ev[i]! - el[i]! : null));
  const primo = linea.findIndex((v) => v !== null);
  const segnale: Serie = valori.map(() => null);
  if (primo >= 0) {
    const sottoserie = ema(linea.slice(primo) as number[], periodoSegnale);
    sottoserie.forEach((v, j) => (segnale[primo + j] = v));
  }
  const istogramma: Serie = linea.map((v, i) => (v !== null && segnale[i] !== null ? v - segnale[i]! : null));
  return { macd: linea, segnale, istogramma };
}

export type Bollinger = { media: Serie; alta: Serie; bassa: Serie };

// Bande di Bollinger: SMA ± `k` deviazioni standard (popolazione) sullo stesso periodo.
export function bollinger(valori: number[], periodo = 20, k = 2): Bollinger {
  const media = sma(valori, periodo);
  const alta: Serie = [];
  const bassa: Serie = [];
  for (let i = 0; i < valori.length; i++) {
    const m = media[i];
    if (m === null) {
      alta.push(null);
      bassa.push(null);
      continue;
    }
    let varianza = 0;
    for (let j = i - periodo + 1; j <= i; j++) varianza += (valori[j] - m) ** 2;
    const dev = Math.sqrt(varianza / periodo);
    alta.push(m + k * dev);
    bassa.push(m - k * dev);
  }
  return { media, alta, bassa };
}

export const LIVELLI_FIBONACCI = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1] as const;

// Ritracciamenti di un movimento da `minimo` a `massimo` (rialzista): il
// livello 0 è il massimo, 1 il punto di partenza.
export function ritracciamentiFibonacci(minimo: number, massimo: number) {
  return LIVELLI_FIBONACCI.map((l) => ({ livello: l, prezzo: massimo - (massimo - minimo) * l }));
}

// Indici in cui la serie veloce attraversa quella lenta. "rialzista" =
// veloce passa sopra (golden cross con 50/200), "ribassista" = sotto.
export function incroci(veloce: Serie, lenta: Serie) {
  const out: { indice: number; tipo: "rialzista" | "ribassista" }[] = [];
  for (let i = 1; i < veloce.length; i++) {
    const a0 = veloce[i - 1], b0 = lenta[i - 1], a1 = veloce[i], b1 = lenta[i];
    if (a0 === null || b0 === null || a1 === null || b1 === null) continue;
    if (a0 <= b0 && a1 > b1) out.push({ indice: i, tipo: "rialzista" });
    if (a0 >= b0 && a1 < b1) out.push({ indice: i, tipo: "ribassista" });
  }
  return out;
}

// Gestione del rischio: quante azioni comprare perché, se lo stop scatta, la
// perdita sia la percentuale di capitale scelta. Arrotonda per difetto.
export function dimensionePosizione(capitale: number, rischioPercento: number, ingresso: number, stop: number) {
  const rischioPerAzione = Math.abs(ingresso - stop);
  if (capitale <= 0 || rischioPercento <= 0 || rischioPerAzione === 0) {
    return { azioni: 0, rischioEuro: 0, controvalore: 0, rischioPerAzione };
  }
  const rischioEuro = (capitale * rischioPercento) / 100;
  const azioni = Math.floor(rischioEuro / rischioPerAzione);
  return { azioni, rischioEuro, controvalore: azioni * ingresso, rischioPerAzione };
}

// Rapporto rischio/rendimento: quanto si guadagna al target per ogni unità
// persa allo stop (2 = "2R").
export function rapportoRischioRendimento(ingresso: number, stop: number, target: number) {
  const rischio = Math.abs(ingresso - stop);
  return rischio === 0 ? 0 : Math.abs(target - ingresso) / rischio;
}
