import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { parseCryptoRawCsv, type RawTransaction } from "@/lib/parsers/raw-crypto";
import { parseIntesaRawXlsx } from "@/lib/parsers/raw-intesa";
import { parseTradeRepublicPdf } from "@/lib/parsers/raw-traderepublic-pdf";
import { applicaCategorizzazione, type CategorizedRow } from "@/lib/categorization/apply";
import { flagDuplicates } from "@/lib/spese/dedup";
import type { ImportRowError } from "@/lib/parsers/import-excel";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const formData = await request.formData();
  const cryptoFile = formData.get("crypto");
  const intesaFile = formData.get("intesa");
  const tradeRepublicFile = formData.get("traderepublic");

  if (!(cryptoFile instanceof File) && !(intesaFile instanceof File) && !(tradeRepublicFile instanceof File)) {
    return NextResponse.json(
      { error: "Carica almeno un file (Crypto.com, Intesa Sanpaolo o Trade Republic)." },
      { status: 400 }
    );
  }
  if (tradeRepublicFile instanceof File && tradeRepublicFile.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "PDF Trade Republic troppo grande (max 10 MB)." }, { status: 400 });
  }

  const righeGrezze: RawTransaction[] = [];
  const erroriParsing: ImportRowError[] = [];

  if (cryptoFile instanceof File) {
    const testo = await cryptoFile.text();
    const { righe, errori } = parseCryptoRawCsv(testo);
    righeGrezze.push(...righe);
    erroriParsing.push(...errori);
  }

  if (intesaFile instanceof File) {
    const { righe, errori } = await parseIntesaRawXlsx(await intesaFile.arrayBuffer());
    righeGrezze.push(...righe);
    erroriParsing.push(...errori);
  }

  if (tradeRepublicFile instanceof File) {
    const { righe, errori } = await parseTradeRepublicPdf(await tradeRepublicFile.arrayBuffer());
    righeGrezze.push(...righe);
    erroriParsing.push(...errori);
  }

  const { categorizzate, escluse } = applicaCategorizzazione(righeGrezze);
  const righe = (await flagDuplicates(categorizzate)) as (CategorizedRow & { duplicato: boolean })[];

  return NextResponse.json({ righe, escluse, erroriParsing });
}
