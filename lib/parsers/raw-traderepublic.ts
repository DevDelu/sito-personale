import type { ImportRowError } from "@/lib/parsers/import-excel";
import type { RawTransaction } from "@/lib/parsers/raw-crypto";

// Parser dell'estratto conto PDF di Trade Republic (conto corrente).
// Lavora sugli elementi di testo con coordinate estratti dal PDF (vedi
// raw-traderepublic-pdf.ts), così resta puro e testabile senza il PDF.
//
// Il verso del movimento (entrata/uscita) si ricava dalla variazione del
// saldo progressivo, non dalla posizione della colonna: è il dato più
// affidabile, perché nel PDF importo e saldo a volte finiscono nello stesso
// elemento di testo. La colonna resta il fallback quando il saldo manca.
// In fondo si confrontano i totali con il riepilogo in testa all'estratto:
// se non coincidono una riga è stata persa o letta male, e lo si segnala.

export type PdfTextItem = {
  page: number;
  x: number;
  y: number; // coordinate PDF: y cresce verso l'alto
  str: string;
};

export type RiepilogoTradeRepublic = {
  saldoIniziale: number | null;
  entrate: number | null;
  uscite: number | null;
  saldoFinale: number | null;
};

const MESI: Record<string, number> = {
  gen: 1, jan: 1,
  feb: 2,
  mar: 3, mär: 3, mrz: 3,
  apr: 4,
  mag: 5, may: 5, mai: 5,
  giu: 6, jun: 6,
  lug: 7, jul: 7,
  ago: 8, aug: 8,
  set: 9, sep: 9, sept: 9,
  ott: 10, oct: 10, okt: 10,
  nov: 11,
  dic: 12, dec: 12, dez: 12,
};

const DATA_RE = /^(\d{1,2})\s+([a-zà-ü]{3,4})\.?(?:\s+(\d{4}))?$/i;
const ANNO_RE = /^\d{4}$/;
const IMPORTO_RE = /(-?\d{1,3}(?:\.\d{3})*,\d{2})\s*€/g;

function norm(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function importoIt(testo: string): number {
  return Number(testo.replace(/\./g, "").replace(",", "."));
}

function arrotonda(n: number): number {
  return Math.round(n * 100) / 100;
}

function importiIn(testo: string): number[] {
  return [...testo.matchAll(IMPORTO_RE)].map((m) => importoIt(m[1]));
}

// Ordine di lettura: dall'alto in basso, poi da sinistra a destra.
function ordinaLettura(a: PdfTextItem, b: PdfTextItem): number {
  if (Math.abs(a.y - b.y) > 2) return b.y - a.y;
  return a.x - b.x;
}

function trova(items: PdfTextItem[], testo: string): PdfTextItem | undefined {
  const t = testo.toLowerCase();
  return items.find((i) => norm(i.str).toLowerCase() === t);
}

function leggiRiepilogo(items: PdfTextItem[]): RiepilogoTradeRepublic {
  const vuoto: RiepilogoTradeRepublic = { saldoIniziale: null, entrate: null, uscite: null, saldoFinale: null };

  const hSaldoIniziale = trova(items, "SALDO INIZIALE");
  if (!hSaldoIniziale) return vuoto;
  const page = hSaldoIniziale.page;
  const stessaPagina = items.filter((i) => i.page === page);
  const headerY = hSaldoIniziale.y;

  const colonne: { chiave: keyof RiepilogoTradeRepublic; x: number }[] = [];
  const mappa: [string, keyof RiepilogoTradeRepublic][] = [
    ["SALDO INIZIALE", "saldoIniziale"],
    ["IN ENTRATA", "entrate"],
    ["IN USCITA", "uscite"],
    ["SALDO FINALE", "saldoFinale"],
  ];
  for (const [etichetta, chiave] of mappa) {
    const h = stessaPagina.find((i) => norm(i.str).toUpperCase() === etichetta && Math.abs(i.y - headerY) < 4);
    if (h) colonne.push({ chiave, x: h.x });
  }

  // Solo la riga del conto corrente: è l'unico prodotto che importiamo.
  const etichettaConto = stessaPagina.find(
    (i) => norm(i.str).toLowerCase() === "conto corrente" && i.y < headerY
  );
  if (!etichettaConto || colonne.length === 0) return vuoto;

  const risultato = { ...vuoto };
  const valori = stessaPagina.filter((i) => Math.abs(i.y - etichettaConto.y) < 3 && i !== etichettaConto);
  for (const v of valori) {
    const importi = importiIn(v.str);
    if (importi.length !== 1) continue;
    const colonna = colonne.reduce((best, c) => (Math.abs(c.x - v.x) < Math.abs(best.x - v.x) ? c : best));
    risultato[colonna.chiave] = importi[0];
  }
  return risultato;
}

type ColonneTabella = {
  headerY: number;
  xTipo: number;
  xDescrizione: number;
  xEntrata: number;
  xUscita: number;
};

function leggiIntestazioneTabella(pagina: PdfTextItem[]): ColonneTabella | null {
  const descr = trova(pagina, "DESCRIZIONE");
  if (!descr) return null;
  const riga = pagina.filter((i) => Math.abs(i.y - descr.y) <= 6);
  const tipo = riga.find((i) => norm(i.str).toUpperCase() === "TIPO");
  const entrata = riga.find((i) => /ENTRATA$/i.test(norm(i.str)));
  const uscita = riga.find((i) => /USCITA$/i.test(norm(i.str)));
  if (!tipo || !entrata || !uscita) return null;
  return {
    headerY: descr.y,
    xTipo: tipo.x,
    xDescrizione: descr.x,
    xEntrata: entrata.x,
    xUscita: uscita.x,
  };
}

// Limite inferiore della tabella: il blocco "Panoramica del saldo" se la
// tabella finisce su questa pagina, altrimenti il piè di pagina legale.
function limiteInferiore(pagina: PdfTextItem[], headerY: number): number {
  const panoramica = pagina.find((i) => /^panoramica del saldo/i.test(norm(i.str)) && i.y < headerY);
  if (panoramica) return panoramica.y + 4;
  const piede = pagina
    .filter((i) => i.y < 130 && /^trade republic bank gmbh/i.test(norm(i.str)))
    .reduce<number | null>((max, i) => (max === null || i.y > max ? i.y : max), null);
  return piede !== null ? piede + 4 : 90;
}

type Ancora = { item: PdfTextItem; giorno: number; mese: number; anno: number | null; yFondo: number };

export function parseTradeRepublicItems(items: PdfTextItem[]): {
  righe: RawTransaction[];
  errori: ImportRowError[];
  riepilogo: RiepilogoTradeRepublic;
} {
  const righe: RawTransaction[] = [];
  const errori: ImportRowError[] = [];
  const riepilogo = leggiRiepilogo(items);

  const pagine = [...new Set(items.map((i) => i.page))].sort((a, b) => a - b);
  let saldoPrecedente = riepilogo.saldoIniziale;
  let numeroRiga = 0;
  let tabellaTrovata = false;
  let totaleEntrate = 0;
  let totaleUscite = 0;

  for (const p of pagine) {
    const pagina = items.filter((i) => i.page === p && norm(i.str) !== "");
    const col = leggiIntestazioneTabella(pagina);
    if (!col) continue;
    tabellaTrovata = true;

    const fondo = limiteInferiore(pagina, col.headerY);
    const corpo = pagina.filter((i) => i.y < col.headerY - 3 && i.y > fondo).sort(ordinaLettura);

    // Ogni movimento comincia con la data nella prima colonna ("12 nov"),
    // con l'anno di solito su una riga a parte subito sotto.
    const ancore: Ancora[] = [];
    for (const item of corpo) {
      if (item.x >= col.xTipo - 2) continue;
      const m = norm(item.str).match(DATA_RE);
      if (!m) continue;
      const mese = MESI[m[2].toLowerCase()];
      if (!mese) continue;
      let anno = m[3] ? Number(m[3]) : null;
      let yFondo = item.y;
      if (anno === null) {
        const rigaAnno = corpo.find(
          (i) => Math.abs(i.x - item.x) < 4 && i.y < item.y && i.y >= item.y - 14 && ANNO_RE.test(norm(i.str))
        );
        if (rigaAnno) {
          anno = Number(norm(rigaAnno.str));
          yFondo = rigaAnno.y;
        }
      }
      ancore.push({ item, giorno: Number(m[1]), mese, anno, yFondo });
    }

    for (let a = 0; a < ancore.length; a++) {
      const ancora = ancore[a];
      numeroRiga++;

      // Confini verticali del blocco: a metà dello spazio tra un movimento
      // e l'altro, così le descrizioni su più righe restano nel blocco giusto.
      const sopra = a === 0 ? col.headerY - 3 : (ancore[a - 1].yFondo + ancora.item.y) / 2;
      const sotto = a === ancore.length - 1 ? fondo : (ancora.yFondo + ancore[a + 1].item.y) / 2;
      const blocco = corpo.filter((i) => i.y <= sopra && i.y > sotto).sort(ordinaLettura);

      const tipoBanca = norm(
        blocco.filter((i) => i.x >= col.xTipo - 2 && i.x < col.xDescrizione - 2).map((i) => i.str).join(" ")
      );
      const descrizione = norm(
        blocco
          .filter((i) => i.x >= col.xDescrizione - 2 && i.x < col.xEntrata - 8)
          .map((i) => i.str)
          .join(" ")
      );
      const elementiImporto = blocco.filter((i) => i.x >= col.xEntrata - 8);
      const importi = importiIn(elementiImporto.map((i) => i.str).join(" "));

      if (ancora.anno === null) {
        errori.push({ riga: numeroRiga, messaggio: `Anno non trovato per il movimento del "${norm(ancora.item.str)}".` });
        continue;
      }
      if (importi.length < 2) {
        errori.push({ riga: numeroRiga, messaggio: `Importo o saldo non leggibile per "${descrizione || tipoBanca}".` });
        continue;
      }

      const importo = Math.abs(importi[0]);
      const saldo = importi[importi.length - 1];
      const primoImporto = elementiImporto[0];
      const versoDaColonna: RawTransaction["tipo"] =
        Math.abs(primoImporto.x - col.xUscita) < Math.abs(primoImporto.x - col.xEntrata) ? "spesa" : "entrata";

      let tipo = versoDaColonna;
      if (saldoPrecedente !== null) {
        const delta = arrotonda(saldo - saldoPrecedente);
        if (Math.abs(Math.abs(delta) - importo) < 0.01) {
          tipo = delta < 0 ? "spesa" : "entrata";
        } else {
          errori.push({
            riga: numeroRiga,
            messaggio: `Saldo incoerente per "${descrizione}": ${saldoPrecedente.toFixed(2)} → ${saldo.toFixed(2)} con importo ${importo.toFixed(2)}. Verso preso dalla colonna, controlla la riga.`,
          });
        }
      }
      saldoPrecedente = saldo;

      if (importo === 0) continue;
      if (tipo === "entrata") totaleEntrate += importo;
      else totaleUscite += importo;

      const data = `${ancora.anno}-${String(ancora.mese).padStart(2, "0")}-${String(ancora.giorno).padStart(2, "0")}`;
      righe.push({
        data,
        importo,
        tipo,
        descrizioneGrezza: descrizione || tipoBanca,
        dettagliGrezzi: tipoBanca ? `${tipoBanca} — ${descrizione}` : descrizione,
        categoriaBanca: null,
        fonte: "traderepublic",
        tipoBanca: tipoBanca || null,
      });
    }
  }

  if (!tabellaTrovata) {
    errori.push({
      riga: 0,
      messaggio: 'Tabella "Transazioni sul conto" non trovata: il PDF non sembra un estratto conto Trade Republic.',
    });
    return { righe, errori, riepilogo };
  }

  const controlli: [string, number | null, number][] = [
    ["entrate", riepilogo.entrate, totaleEntrate],
    ["uscite", riepilogo.uscite, totaleUscite],
  ];
  for (const [nome, atteso, letto] of controlli) {
    if (atteso !== null && Math.abs(arrotonda(letto) - atteso) >= 0.01) {
      errori.push({
        riga: 0,
        messaggio: `Totale ${nome} letto (${letto.toFixed(2)} €) diverso dal riepilogo dell'estratto (${atteso.toFixed(2)} €): qualche riga potrebbe mancare.`,
      });
    }
  }
  if (riepilogo.saldoFinale !== null && saldoPrecedente !== null && Math.abs(saldoPrecedente - riepilogo.saldoFinale) >= 0.01) {
    errori.push({
      riga: 0,
      messaggio: `Saldo finale letto (${saldoPrecedente.toFixed(2)} €) diverso da quello dell'estratto (${riepilogo.saldoFinale.toFixed(2)} €).`,
    });
  }

  return { righe, errori, riepilogo };
}
