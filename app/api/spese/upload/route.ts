import { NextResponse } from "next/server";
import Papa from "papaparse";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { dedupKey, mondayOf, parseData, parseImporto, resolveColumn } from "@/lib/csv";

type ParsedRow = {
  importo: number;
  descrizione: string | null;
  data: string;
  settimana_riferimento: string;
  categoria_id: string | null;
  fonte: "csv_upload";
};

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nessun file ricevuto." }, { status: 400 });
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json(
      { error: `CSV non valido: ${parsed.errors[0].message}` },
      { status: 400 }
    );
  }

  const headers = parsed.meta.fields ?? [];
  const col = {
    importo: resolveColumn(headers, "importo"),
    descrizione: resolveColumn(headers, "descrizione"),
    data: resolveColumn(headers, "data"),
    categoria: resolveColumn(headers, "categoria"),
  };

  if (!col.importo || !col.data) {
    return NextResponse.json(
      {
        error:
          "Il CSV deve avere almeno le colonne 'importo' e 'data' (nomi accettati: importo/amount, data/date, descrizione, categoria).",
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Mappa nome categoria (lowercase) -> id, con creazione automatica delle categorie mancanti.
  const { data: categorie, error: categorieError } = await admin
    .from("categorie")
    .select("id, nome");

  if (categorieError) {
    return NextResponse.json({ error: categorieError.message }, { status: 500 });
  }

  const categoriaMap = new Map<string, string>(
    (categorie ?? []).map((c) => [c.nome.toLowerCase(), c.id])
  );

  const rowsSkippedInvalid: number[] = [];
  const candidateRows: ParsedRow[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const raw = parsed.data[i];
    const importo = parseImporto(raw[col.importo]);
    const data = parseData(raw[col.data]);

    if (importo === null || data === null) {
      rowsSkippedInvalid.push(i + 2); // +2: header + 1-based index
      continue;
    }

    const descrizione = col.descrizione ? raw[col.descrizione]?.trim() || null : null;
    const categoriaNome = col.categoria ? raw[col.categoria]?.trim() : "";

    let categoria_id: string | null = null;
    if (categoriaNome) {
      const key = categoriaNome.toLowerCase();
      categoria_id = categoriaMap.get(key) ?? null;
      if (!categoria_id) {
        const { data: nuova, error: insertCatError } = await admin
          .from("categorie")
          .insert({ nome: categoriaNome })
          .select("id")
          .single();
        if (insertCatError) {
          return NextResponse.json({ error: insertCatError.message }, { status: 500 });
        }
        categoria_id = nuova.id;
        categoriaMap.set(key, nuova.id);
      }
    }

    candidateRows.push({
      importo,
      descrizione,
      data,
      settimana_riferimento: mondayOf(data),
      categoria_id,
      fonte: "csv_upload",
    });
  }

  // Dedup: confronta con le spese già presenti nell'intervallo di date del CSV
  // (stessa data + importo + descrizione + categoria => riga già caricata, la salto).
  let inserted = 0;
  let skippedDuplicates = 0;

  if (candidateRows.length > 0) {
    const dates = candidateRows.map((r) => r.data).sort();
    const { data: existing, error: existingError } = await admin
      .from("spese")
      .select("data, importo, descrizione, categoria_id")
      .gte("data", dates[0])
      .lte("data", dates[dates.length - 1]);

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const existingKeys = new Set(
      (existing ?? []).map((r) =>
        dedupKey({
          data: r.data,
          importo: Number(r.importo),
          descrizione: r.descrizione,
          categoria_id: r.categoria_id,
        })
      )
    );

    const toInsert: ParsedRow[] = [];
    for (const row of candidateRows) {
      const key = dedupKey(row);
      if (existingKeys.has(key)) {
        skippedDuplicates++;
        continue;
      }
      existingKeys.add(key); // evita doppi anche all'interno dello stesso file
      toInsert.push(row);
    }

    if (toInsert.length > 0) {
      const { error: insertError } = await admin.from("spese").insert(toInsert);
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      inserted = toInsert.length;
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
    inserted,
    skippedDuplicates,
    skippedInvalidRows: rowsSkippedInvalid,
    totaleSettimanaCorrente,
    totaleSettimanaPrecedente,
  });
}
