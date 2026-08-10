import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { parseCryptoRawCsv, type RawTransaction } from "@/lib/parsers/raw-crypto";
import { parseIntesaRawXlsx } from "@/lib/parsers/raw-intesa";
import { applicaCategorizzazione, type CategorizedRow } from "@/lib/categorization/apply";
import { flagDuplicates } from "@/lib/spese/dedup";
import type { ImportRowError } from "@/lib/parsers/import-excel";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const formData = await request.formData();
  const cryptoFile = formData.get("crypto");
  const intesaFile = formData.get("intesa");

  if (!(cryptoFile instanceof File) && !(intesaFile instanceof File)) {
    return NextResponse.json({ error: "Carica almeno un file (Crypto.com o Intesa Sanpaolo)." }, { status: 400 });
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

  const { categorizzate, escluse } = applicaCategorizzazione(righeGrezze);
  const righe = (await flagDuplicates(categorizzate)) as (CategorizedRow & { duplicato: boolean })[];

  return NextResponse.json({ righe, escluse, erroriParsing });
}
