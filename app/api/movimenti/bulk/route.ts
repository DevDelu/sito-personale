import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";

type Tipo = "spesa" | "entrata";
type BulkItem = { id: string; tipo: Tipo };
type BulkPatch = {
  categoria_id?: string;
  tipo?: Tipo;
  descrizione?: string | null;
  data?: string;
  importo?: number;
};

// Colonne comuni a spese/depositi: spese ha in più `settimana_riferimento`
// (vedi supabase/schema.sql), che va quindi portata solo quando la tabella
// di destinazione è spese e omessa quando è depositi (colonna inesistente lì).
const COMMON_COLUMNS = [
  "id",
  "importo",
  "descrizione",
  "data",
  "fonte",
  "created_at",
  "titolo",
  "categoria_banca",
  "categoria_id",
  "nominativo",
  "dettaglio",
  "note",
] as const;

function tabellaPer(tipo: Tipo): "spese" | "depositi" {
  return tipo === "spesa" ? "spese" : "depositi";
}

function parseItems(body: unknown): BulkItem[] | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { items?: unknown }).items)) {
    return null;
  }
  const items = (body as { items: unknown[] }).items;
  const parsed: BulkItem[] = [];
  for (const item of items) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as { id?: unknown }).id !== "string" ||
      ((item as { tipo?: unknown }).tipo !== "spesa" && (item as { tipo?: unknown }).tipo !== "entrata")
    ) {
      return null;
    }
    parsed.push({ id: (item as { id: string }).id, tipo: (item as { tipo: Tipo }).tipo });
  }
  return parsed.length > 0 ? parsed : null;
}

function parsePatch(body: unknown): BulkPatch | null {
  const patchRaw = (body as { patch?: unknown })?.patch;
  if (!patchRaw || typeof patchRaw !== "object") return null;

  const patch: BulkPatch = {};
  const p = patchRaw as Record<string, unknown>;

  if ("categoria_id" in p) {
    if (typeof p.categoria_id !== "string" || !p.categoria_id) return null;
    patch.categoria_id = p.categoria_id;
  }
  if ("tipo" in p) {
    if (p.tipo !== "spesa" && p.tipo !== "entrata") return null;
    patch.tipo = p.tipo;
  }
  if ("descrizione" in p) {
    patch.descrizione = typeof p.descrizione === "string" ? p.descrizione : null;
  }
  if ("data" in p) {
    if (typeof p.data !== "string" || !p.data) return null;
    patch.data = p.data;
  }
  if ("importo" in p) {
    const importo = Number(p.importo);
    if (!Number.isFinite(importo) || importo <= 0) return null;
    patch.importo = importo;
  }

  return patch;
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const items = parseItems(body);
  if (!items) return NextResponse.json({ error: "Elenco movimenti non valido." }, { status: 400 });

  const patch = parsePatch(body);
  if (!patch) return NextResponse.json({ error: "Modifiche non valide." }, { status: 400 });

  const { tipo: nuovoTipo, ...columnPatchRaw } = patch;
  const columnPatch: Record<string, unknown> = { ...columnPatchRaw };
  if (Object.keys(columnPatch).length === 0 && !nuovoTipo) {
    return NextResponse.json({ error: "Nessun campo da aggiornare." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Nessun cambio di tipo: due update batch, uno per tabella coinvolta.
  if (!nuovoTipo) {
    const idsPerTabella: Record<"spese" | "depositi", string[]> = { spese: [], depositi: [] };
    for (const item of items) idsPerTabella[tabellaPer(item.tipo)].push(item.id);

    for (const tabella of ["spese", "depositi"] as const) {
      const ids = idsPerTabella[tabella];
      if (ids.length === 0) continue;
      const { error } = await admin.from(tabella).update(columnPatch).in("id", ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  // Cambio di tipo: le righe già del tipo target restano nella stessa
  // tabella (update in place); quelle dell'altro tipo vanno spostate da una
  // tabella all'altra (select + insert batch, poi delete batch) perché
  // spesa/entrata sono due tabelle distinte, non una colonna `tipo`.
  const targetTable = tabellaPer(nuovoTipo);
  const sourceTable = targetTable === "spese" ? "depositi" : "spese";

  const idsStay = items.filter((i) => tabellaPer(i.tipo) === targetTable).map((i) => i.id);
  const idsMove = items.filter((i) => tabellaPer(i.tipo) === sourceTable).map((i) => i.id);

  if (idsStay.length > 0) {
    const { error } = await admin.from(targetTable).update(columnPatch).in("id", idsStay);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (idsMove.length > 0) {
    const { data: righeSorgente, error: selectError } = await admin
      .from(sourceTable)
      .select(COMMON_COLUMNS.join(","))
      .in("id", idsMove);
    if (selectError) return NextResponse.json({ error: selectError.message }, { status: 500 });

    const righeSpostate = (righeSorgente ?? []).map((riga) => {
      const row = riga as unknown as Record<string, unknown>;
      const nuovaRiga: Record<string, unknown> = {};
      for (const col of COMMON_COLUMNS) nuovaRiga[col] = row[col];
      if (targetTable === "spese") nuovaRiga.settimana_riferimento = null;
      return { ...nuovaRiga, ...columnPatch };
    });

    if (righeSpostate.length > 0) {
      const { error: insertError } = await admin.from(targetTable).insert(righeSpostate);
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const { error: deleteError } = await admin.from(sourceTable).delete().in("id", idsMove);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const items = parseItems(body);
  if (!items) return NextResponse.json({ error: "Elenco movimenti non valido." }, { status: 400 });

  const admin = createAdminClient();
  const idsPerTabella: Record<"spese" | "depositi", string[]> = { spese: [], depositi: [] };
  for (const item of items) idsPerTabella[tabellaPer(item.tipo)].push(item.id);

  for (const tabella of ["spese", "depositi"] as const) {
    const ids = idsPerTabella[tabella];
    if (ids.length === 0) continue;
    const { error } = await admin.from(tabella).delete().in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
