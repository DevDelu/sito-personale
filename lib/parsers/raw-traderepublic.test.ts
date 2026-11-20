import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTradeRepublicItems, type PdfTextItem } from "./raw-traderepublic.ts";

// Layout sintetico che riproduce le coordinate dell'estratto conto reale
// (dati inventati: il repo è pubblico). Importo e saldo a volte sono nello
// stesso elemento di testo, come nel PDF vero.
const i = (page: number, x: number, y: number, str: string): PdfTextItem => ({ page, x, y, str });

function intestazioneTabella(page: number, y: number): PdfTextItem[] {
  return [
    i(page, 74, y, "DATA"),
    i(page, 101, y, "TIPO"),
    i(page, 148, y, "DESCRIZIONE"),
    i(page, 432, y + 3, "IN"),
    i(page, 432, y - 3, "ENTRATA"),
    i(page, 463, y + 3, "IN"),
    i(page, 463, y - 3, "USCITA"),
    i(page, 501, y, "SALDO"),
  ];
}

function piede(page: number): PdfTextItem[] {
  return [i(page, 73, 78, "Trade Republic Bank GmbH, Branch Italy"), i(page, 482, 28, `Pagina ${page} da 2`)];
}

function riepilogo(iniziale: string, entrate: string, uscite: string, finale: string): PdfTextItem[] {
  return [
    i(1, 74, 630, "ESTRATTO CONTO RIASSUNTIVO"),
    i(1, 74, 596, "PRODOTTO"),
    i(1, 191, 596, "SALDO INIZIALE"),
    i(1, 288, 596, "IN ENTRATA"),
    i(1, 362, 596, "IN USCITA"),
    i(1, 483, 596, "SALDO FINALE"),
    i(1, 74, 580, "Conto corrente"),
    i(1, 191, 580, iniziale),
    i(1, 288, 580, entrate),
    i(1, 362, 580, uscite),
    i(1, 491, 580, finale),
  ];
}

const estratto: PdfTextItem[] = [
  ...riepilogo("10,00 €", "1.250,00 €", "60,50 €", "1.199,50 €"),
  ...intestazioneTabella(1, 492),
  // Bonifico in entrata, importo e saldo separati
  i(1, 74, 473, "03 mar"),
  i(1, 74, 465, "2026"),
  i(1, 101, 469, "Bonifico"),
  i(1, 148, 469, "Incoming transfer from MARIO ROSSI (IT00X0000000000000000000000)"),
  i(1, 432, 469, "1.200,00 €"),
  i(1, 490, 469, "1.210,00 €"),
  // Spesa con carta, importo e saldo nello stesso elemento
  i(1, 74, 441, "04 mar"),
  i(1, 74, 433, "2026"),
  i(1, 101, 441, "Transazione"),
  i(1, 101, 433, "con carta"),
  i(1, 148, 437, "BAR ESEMPIO SRL"),
  i(1, 463, 437, "50,00 € 1.160,00 €"),
  ...piede(1),
  ...intestazioneTabella(2, 681),
  // Rimborso su carta: entrata riconosciuta dal saldo che sale
  i(2, 74, 662, "05 mar"),
  i(2, 74, 654, "2026"),
  i(2, 101, 662, "Transazione"),
  i(2, 101, 654, "con carta"),
  i(2, 148, 658, "NEGOZIO FINTO"),
  i(2, 432, 658, "50,00 €"),
  i(2, 490, 658, "1.210,00 €"),
  // Piano di accumulo con descrizione su due righe
  i(2, 74, 630, "06 mar"),
  i(2, 74, 623, "2026"),
  i(2, 101, 626, "Commercio"),
  i(2, 148, 630, "Savings plan execution IE0000000000 Fondo Esempio"),
  i(2, 148, 623, "UCITS ETF (Acc), quantity: 0.1"),
  i(2, 463, 626, "10,50 €"),
  i(2, 490, 626, "1.199,50 €"),
  i(2, 74, 560, "PANORAMICA DEL SALDO"),
  i(2, 491, 520, "1.199,50 €"),
  ...piede(2),
];

test("legge tutti i movimenti su più pagine con data, verso e importo", () => {
  const { righe, errori } = parseTradeRepublicItems(estratto);
  assert.deepEqual(errori, []);
  assert.deepEqual(
    righe.map((r) => [r.data, r.tipo, r.importo]),
    [
      ["2026-03-03", "entrata", 1200],
      ["2026-03-04", "spesa", 50],
      ["2026-03-05", "entrata", 50],
      ["2026-03-06", "spesa", 10.5],
    ]
  );
  assert.ok(righe.every((r) => r.fonte === "traderepublic"));
});

test("unisce le descrizioni su più righe e conserva il tipo operazione della banca", () => {
  const { righe } = parseTradeRepublicItems(estratto);
  const piano = righe[3];
  assert.equal(piano.tipoBanca, "Commercio");
  assert.equal(
    piano.descrizioneGrezza,
    "Savings plan execution IE0000000000 Fondo Esempio UCITS ETF (Acc), quantity: 0.1"
  );
  assert.equal(righe[1].tipoBanca, "Transazione con carta");
  assert.equal(righe[1].descrizioneGrezza, "BAR ESEMPIO SRL");
});

test("legge il riepilogo del conto corrente", () => {
  const { riepilogo } = parseTradeRepublicItems(estratto);
  assert.deepEqual(riepilogo, { saldoIniziale: 10, entrate: 1250, uscite: 60.5, saldoFinale: 1199.5 });
});

test("segnala quando i totali non coincidono col riepilogo (riga persa)", () => {
  const senzaRimborso = estratto.filter((it) => !(it.page === 2 && it.y >= 654 && it.y <= 662));
  const { errori } = parseTradeRepublicItems(senzaRimborso);
  assert.ok(errori.some((e) => e.riga === 0 && e.messaggio.includes("Totale entrate")));
});

test("un PDF che non è un estratto Trade Republic dà errore, non righe vuote silenziose", () => {
  const { righe, errori } = parseTradeRepublicItems([i(1, 74, 700, "Fattura n. 12")]);
  assert.equal(righe.length, 0);
  assert.match(errori[0].messaggio, /non sembra un estratto conto Trade Republic/);
});
