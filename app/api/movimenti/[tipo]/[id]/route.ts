import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const CAMPI_MODIFICABILI = [
  "importo",
  "data",
  "categoria_id",
  "titolo",
  "descrizione",
  "nominativo",
  "dettaglio",
] as const;

function tabellaPer(tipo: string): "spese" | "depositi" | null {
  if (tipo === "spesa") return "spese";
  if (tipo === "entrata") return "depositi";
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tipo: string; id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { tipo, id } = await params;
  const tabella = tabellaPer(tipo);
  if (!tabella) return NextResponse.json({ error: "Tipo non valido." }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corpo della richiesta non valido." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const campo of CAMPI_MODIFICABILI) {
    if (campo in body) patch[campo] = body[campo];
  }

  if ("importo" in patch) {
    const importo = Number(patch.importo);
    if (!Number.isFinite(importo) || importo <= 0) {
      return NextResponse.json({ error: "Importo non valido." }, { status: 400 });
    }
    patch.importo = importo;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nessun campo da aggiornare." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from(tabella).update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tipo: string; id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { tipo, id } = await params;
  const tabella = tabellaPer(tipo);
  if (!tabella) return NextResponse.json({ error: "Tipo non valido." }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from(tabella).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
