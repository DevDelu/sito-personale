// Rilevamento deterministico delle uscite ricorrenti (abbonamenti, canoni,
// rate). Funzione pura, nessuna AI né categorizzazione server: raggruppa per
// titolo normalizzato e controlla regolarità di intervallo e stabilità
// dell'importo. Solo lettura, nessun accesso al database.

export type Cadenza = "settimanale" | "mensile" | "annuale";

export type SpesaGrezza = { titolo: string | null; importo: number; data: string };

export type Ricorrente = {
  titolo: string;
  cadenza: Cadenza;
  importoTipico: number;
  ultimaData: string;
  prossimaData: string;
  costoAnnuo: number;
  importoAumentato: boolean;
  occorrenze: number;
};

type Regola = {
  /** giorni nominali tra due addebiti */
  periodo: number;
  /** intervallo minimo/massimo (in giorni) per classificare la cadenza */
  minimo: number;
  maxIntervallo: number;
  /** tolleranza in giorni sul primo multiplo */
  tolleranza: number;
  /** quanti periodi consecutivi saltati sono ammessi (1 = nessuno) */
  maxMultiplo: number;
  /** giorni di grazia dopo la data attesa prima di considerarla terminata */
  grazia: number;
  /** addebiti in 12 mesi */
  perAnno: number;
};

const REGOLE: Record<Cadenza, Regola> = {
  settimanale: { periodo: 7, minimo: 5, maxIntervallo: 9, tolleranza: 2, maxMultiplo: 2, grazia: 7, perAnno: 52 },
  mensile: { periodo: 30.44, minimo: 26, maxIntervallo: 34, tolleranza: 3, maxMultiplo: 3, grazia: 10, perAnno: 12 },
  annuale: { periodo: 365, minimo: 355, maxIntervallo: 375, tolleranza: 5, maxMultiplo: 1, grazia: 30, perAnno: 1 },
};

const MIN_OCCORRENZE = 3;
const SOGLIA_STABILITA = 0.1;
const MAX_AUMENTO = 0.5;
const EPSILON = 0.005;

export function normalizzaTitolo(titolo: string): string {
  return titolo.toLowerCase().replace(/\d+/g, "").replace(/\s+/g, " ").trim();
}

function giorni(iso: string): number {
  return Math.round(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);
}

function mediana(valori: number[]): number {
  const v = [...valori].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

function arrotonda(n: number): number {
  return Math.round(n * 100) / 100;
}

function classifica(intervalli: number[]): Cadenza | null {
  const minimo = Math.min(...intervalli);
  for (const c of Object.keys(REGOLE) as Cadenza[]) {
    const r = REGOLE[c];
    if (minimo >= r.minimo && minimo <= r.maxIntervallo) return c;
  }
  return null;
}

function intervalloAmmesso(intervallo: number, r: Regola): boolean {
  const k = Math.round(intervallo / r.periodo);
  if (k < 1 || k > r.maxMultiplo) return false;
  return Math.abs(intervallo - k * r.periodo) <= r.tolleranza + (k - 1);
}

/** Somma `n` mesi a una data ISO, riducendo il giorno se il mese è più corto. */
function aggiungiMesi(iso: string, n: number): string {
  const [a, m, g] = iso.split("-").map(Number);
  const totale = a * 12 + (m - 1) + n;
  const anno = Math.floor(totale / 12);
  const mese = totale % 12;
  const ultimo = new Date(Date.UTC(anno, mese + 1, 0)).getUTCDate();
  return new Date(Date.UTC(anno, mese, Math.min(g, ultimo))).toISOString().slice(0, 10);
}

function prossimaDopo(ultima: string, cadenza: Cadenza): string {
  if (cadenza === "settimanale") return new Date((giorni(ultima) + 7) * 86_400_000).toISOString().slice(0, 10);
  return aggiungiMesi(ultima, cadenza === "mensile" ? 1 : 12);
}

export function trovaRicorrenti(spese: SpesaGrezza[], oggiIso: string): Ricorrente[] {
  const gruppi = new Map<string, { titolo: string; ultimaData: string; righe: { data: string; importo: number }[] }>();

  for (const s of spese) {
    if (!s.titolo || !(s.importo > 0) || !s.data) continue;
    const chiave = normalizzaTitolo(s.titolo);
    if (!chiave) continue;
    const g = gruppi.get(chiave) ?? { titolo: s.titolo.trim(), ultimaData: "", righe: [] };
    g.righe.push({ data: s.data, importo: s.importo });
    // Mostra il titolo dell'addebito più recente.
    if (s.data >= g.ultimaData) {
      g.ultimaData = s.data;
      g.titolo = s.titolo.trim();
    }
    gruppi.set(chiave, g);
  }

  const risultati: Ricorrente[] = [];
  const oggi = giorni(oggiIso);

  for (const g of gruppi.values()) {
    if (g.righe.length < MIN_OCCORRENZE) continue;
    const righe = [...g.righe].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));

    const intervalli: number[] = [];
    for (let i = 1; i < righe.length; i++) intervalli.push(giorni(righe[i].data) - giorni(righe[i - 1].data));

    const cadenza = classifica(intervalli);
    if (!cadenza) continue;
    const regola = REGOLE[cadenza];
    if (!intervalli.every((i) => intervalloAmmesso(i, regola))) continue;

    // Importo: gli addebiti precedenti devono essere stabili; l'ultimo può
    // essere un aumento (segnalato) ma non un valore scollegato.
    const precedenti = righe.slice(0, -1).map((r) => r.importo);
    const medianaPrec = mediana(precedenti);
    if (!precedenti.every((i) => Math.abs(i - medianaPrec) <= medianaPrec * SOGLIA_STABILITA)) continue;
    const ultimo = righe[righe.length - 1];
    if (ultimo.importo < medianaPrec * (1 - SOGLIA_STABILITA) || ultimo.importo > medianaPrec * (1 + MAX_AUMENTO)) continue;

    const importoAumentato = ultimo.importo > medianaPrec + EPSILON;
    const importoTipico = arrotonda(importoAumentato ? ultimo.importo : mediana(righe.map((r) => r.importo)));

    const prossimaData = prossimaDopo(ultimo.data, cadenza);
    // Attesa scaduta da oltre il periodo di grazia: probabilmente disdetta.
    if (giorni(prossimaData) + regola.grazia < oggi) continue;

    risultati.push({
      titolo: g.titolo,
      cadenza,
      importoTipico,
      ultimaData: ultimo.data,
      prossimaData,
      costoAnnuo: arrotonda(importoTipico * regola.perAnno),
      importoAumentato,
      occorrenze: righe.length,
    });
  }

  return risultati.sort((a, b) =>
    a.prossimaData < b.prossimaData ? -1 : a.prossimaData > b.prossimaData ? 1 : a.titolo.localeCompare(b.titolo)
  );
}

export function totaleAnnuo(ricorrenti: Ricorrente[]): number {
  return arrotonda(ricorrenti.reduce((s, r) => s + r.costoAnnuo, 0));
}
