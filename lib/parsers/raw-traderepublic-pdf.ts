import "server-only";
import { getDocumentProxy } from "unpdf";
import type { ImportRowError } from "@/lib/parsers/import-excel";
import type { RawTransaction } from "@/lib/parsers/raw-crypto";
import { parseTradeRepublicItems, type PdfTextItem } from "@/lib/parsers/raw-traderepublic";

const MAX_PAGINE = 50;

async function estraiElementiTesto(buffer: ArrayBuffer): Promise<PdfTextItem[]> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const items: PdfTextItem[] = [];
  const pagine = Math.min(pdf.numPages, MAX_PAGINE);
  for (let p = 1; p <= pagine; p++) {
    const page = await pdf.getPage(p);
    const contenuto = await page.getTextContent();
    for (const item of contenuto.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      items.push({ page: p, x: item.transform[4], y: item.transform[5], str: item.str });
    }
  }
  return items;
}

export async function parseTradeRepublicPdf(
  buffer: ArrayBuffer
): Promise<{ righe: RawTransaction[]; errori: ImportRowError[] }> {
  const intestazione = new TextDecoder().decode(buffer.slice(0, 5));
  if (intestazione !== "%PDF-") {
    return { righe: [], errori: [{ riga: 0, messaggio: "Il file Trade Republic non è un PDF." }] };
  }

  let items: PdfTextItem[];
  try {
    items = await estraiElementiTesto(buffer);
  } catch {
    return { righe: [], errori: [{ riga: 0, messaggio: "PDF Trade Republic non leggibile o protetto da password." }] };
  }

  const { righe, errori } = parseTradeRepublicItems(items);
  return { righe, errori };
}
