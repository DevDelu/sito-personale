import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ImportRow } from "@/lib/parsers/import-excel";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const righe: ImportRow[] = Array.isArray(body?.righe) ? body.righe : [];
  if (righe.length === 0) {
    return NextResponse.json({ error: "Nessuna riga da importare." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: categorie, error: categorieError } = await admin
    .from("categorie")
    .select("id, nome, tipo");
  if (categorieError) {
    return NextResponse.json({ error: categorieError.message }, { status: 500 });
  }

  const categoriaMap = new Map<string, string>(
    (categorie ?? []).map((c) => [`${c.tipo}|${c.nome.toLowerCase()}`, c.id])
  );

  const speseInsert = [];
  const depositiInsert = [];

  for (const riga of righe) {
    const categoriaId = categoriaMap.get(`${riga.tipo}|${riga.categoria.toLowerCase()}`);
    if (!categoriaId) {
      return NextResponse.json(
        { error: `Categoria "${riga.categoria}" non trovata per tipo ${riga.tipo}.` },
        { status: 400 }
      );
    }

    const row = {
      importo: riga.importo,
      titolo: riga.titolo,
      descrizione: riga.descrizione,
      categoria_id: categoriaId,
      nominativo: riga.nominativo,
      dettaglio: riga.dettaglio,
      data: riga.data,
      fonte: riga.fonte,
    };

    if (riga.tipo === "spesa") speseInsert.push(row);
    else depositiInsert.push(row);
  }

  if (speseInsert.length > 0) {
    const { error } = await admin.from("spese").insert(speseInsert);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (depositiInsert.length > 0) {
    const { error } = await admin.from("depositi").insert(depositiInsert);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    insertedSpese: speseInsert.length,
    insertedDepositi: depositiInsert.length,
  });
}
