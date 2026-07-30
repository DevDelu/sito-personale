import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { mondayOf } from "@/lib/csv";
import { keyCrypto, keyGenerico, keyIntesa } from "@/lib/dedup";
import { parseGenericCsv } from "@/lib/parsers/generic";
import { parseCryptoCsv } from "@/lib/parsers/crypto";
import { parseIntesaXlsx } from "@/lib/parsers/intesa";
import type { DraftDepositoRow, DraftSpesaRow, ParseResult } from "@/lib/parsers/types";

const CATEGORIA_DEFAULT = "Da categorizzare";
const SOURCES = ["generico", "crypto", "intesa"] as const;
type Source = (typeof SOURCES)[number];

type SpesaInsertRow = {
  importo: number;
  titolo: string | null;
  descrizione: string | null;
  categoria_id: string | null;
  categoria_banca: string | null;
  data: string;
  settimana_riferimento: string;
  fonte: string;
};

type DepositoInsertRow = {
  importo: number;
  titolo: string | null;
  descrizione: string | null;
  categoria_banca: string | null;
  data: string;
  fonte: string;
};

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const sourceRaw = String(formData.get("source") ?? "generico");
  const source: Source = SOURCES.includes(sourceRaw as Source)
    ? (sourceRaw as Source)
    : "generico";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nessun file ricevuto." }, { status: 400 });
  }

  let result: ParseResult;
  if (source === "generico") {
    result = parseGenericCsv(await file.text());
  } else if (source === "crypto") {
    result = parseCryptoCsv(await file.text());
  } else {
    result = await parseIntesaXlsx(await file.arrayBuffer());
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: categorie, error: categorieError } = await admin
    .from("categorie")
    .select("id, nome");
  if (categorieError) {
    return NextResponse.json({ error: categorieError.message }, { status: 500 });
  }

  const categoriaMap = new Map<string, string>(
    (categorie ?? []).map((c) => [c.nome.toLowerCase(), c.id])
  );
  const categoriaDefaultId = categoriaMap.get(CATEGORIA_DEFAULT.toLowerCase()) ?? null;

  async function resolveCategoriaId(nome: string | null): Promise<string | null> {
    if (!nome) return null;
    const key = nome.toLowerCase();
    const existing = categoriaMap.get(key);
    if (existing) return existing;

    if (source !== "generico") {
      // Le categorie di crypto/intesa sono già normalizzate sul set fisso dei 12;
      // se per qualche motivo mancano, non ne creiamo di nuove: fallback sicuro.
      return categoriaDefaultId;
    }

    const { data: nuova, error: insertCatError } = await admin
      .from("categorie")
      .insert({ nome })
      .select("id")
      .single();
    if (insertCatError) throw new Error(insertCatError.message);
    categoriaMap.set(key, nuova.id);
    return nuova.id;
  }

  let speseInsert: SpesaInsertRow[];
  try {
    speseInsert = await Promise.all(
      result.spese.map(async (row: DraftSpesaRow) => ({
        importo: row.importo,
        titolo: row.titolo,
        descrizione: row.descrizione,
        categoria_id: await resolveCategoriaId(row.categoriaNome),
        categoria_banca: row.categoria_banca,
        data: row.data,
        settimana_riferimento: mondayOf(row.data),
        fonte: row.fonte,
      }))
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const depositiInsert: DepositoInsertRow[] = result.depositi.map(
    (row: DraftDepositoRow) => ({
      importo: row.importo,
      titolo: row.titolo,
      descrizione: row.descrizione,
      categoria_banca: row.categoria_banca,
      data: row.data,
      fonte: row.fonte,
    })
  );

  const keyFn =
    source === "generico" ? keyGenerico : source === "crypto" ? keyCrypto : keyIntesa;

  let insertedSpese = 0;
  let skippedDuplicatesSpese = 0;

  if (speseInsert.length > 0) {
    const dates = speseInsert.map((r) => r.data).sort();
    const { data: existing, error: existingError } = await admin
      .from("spese")
      .select("data, importo, titolo, descrizione, categoria_id")
      .gte("data", dates[0])
      .lte("data", dates[dates.length - 1]);
    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const existingKeys = new Set(
      (existing ?? []).map((r) =>
        keyFn({
          data: r.data,
          importo: Number(r.importo),
          titolo: r.titolo,
          descrizione: r.descrizione,
          categoria_id: r.categoria_id,
        })
      )
    );

    const toInsert: SpesaInsertRow[] = [];
    for (const row of speseInsert) {
      const key = keyFn({
        data: row.data,
        importo: row.importo,
        titolo: row.titolo,
        descrizione: row.descrizione,
        categoria_id: row.categoria_id,
      });
      if (existingKeys.has(key)) {
        skippedDuplicatesSpese++;
        continue;
      }
      existingKeys.add(key);
      toInsert.push(row);
    }

    if (toInsert.length > 0) {
      const { error: insertError } = await admin.from("spese").insert(toInsert);
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      insertedSpese = toInsert.length;
    }
  }

  let insertedDepositi = 0;
  let skippedDuplicatesDepositi = 0;

  if (depositiInsert.length > 0) {
    const dates = depositiInsert.map((r) => r.data).sort();
    const { data: existing, error: existingError } = await admin
      .from("depositi")
      .select("data, importo, titolo, descrizione")
      .gte("data", dates[0])
      .lte("data", dates[dates.length - 1]);
    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const existingKeys = new Set(
      (existing ?? []).map((r) =>
        keyIntesa({
          data: r.data,
          importo: Number(r.importo),
          titolo: r.titolo,
          descrizione: r.descrizione,
        })
      )
    );

    const toInsert: DepositoInsertRow[] = [];
    for (const row of depositiInsert) {
      const key = keyIntesa({
        data: row.data,
        importo: row.importo,
        titolo: row.titolo,
        descrizione: row.descrizione,
      });
      if (existingKeys.has(key)) {
        skippedDuplicatesDepositi++;
        continue;
      }
      existingKeys.add(key);
      toInsert.push(row);
    }

    if (toInsert.length > 0) {
      const { error: insertError } = await admin.from("depositi").insert(toInsert);
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      insertedDepositi = toInsert.length;
    }
  }

  const oggi = new Date();
  const settimanaCorrente = mondayOf(oggi.toISOString().slice(0, 10));
  const settimanaPrecedente = mondayOf(
    new Date(oggi.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  const { data: totali, error: totaliError } = await admin
    .from("spese")
    .select("importo, settimana_riferimento")
    .in("settimana_riferimento", [settimanaCorrente, settimanaPrecedente]);
  if (totaliError) {
    return NextResponse.json({ error: totaliError.message }, { status: 500 });
  }

  const totaleSettimanaCorrente = (totali ?? [])
    .filter((r) => r.settimana_riferimento === settimanaCorrente)
    .reduce((sum, r) => sum + Number(r.importo), 0);
  const totaleSettimanaPrecedente = (totali ?? [])
    .filter((r) => r.settimana_riferimento === settimanaPrecedente)
    .reduce((sum, r) => sum + Number(r.importo), 0);

  return NextResponse.json({
    insertedSpese,
    insertedDepositi,
    skippedDuplicates: skippedDuplicatesSpese + skippedDuplicatesDepositi,
    skippedIgnored: result.skippedIgnored,
    skippedInvalidRows: result.skippedInvalidRows,
    totaleSettimanaCorrente,
    totaleSettimanaPrecedente,
  });
}
