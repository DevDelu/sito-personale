import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const CAMPI_MODIFICABILI = ["asset_id", "tipo", "quantita", "prezzo_unitario", "data", "costo_tipo", "note"] as const;
const COSTO_TIPI = new Set(["verificato", "stimato", "sconosciuto"]);
const TIPI = new Set(["buy", "sell"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corpo della richiesta non valido." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const campo of CAMPI_MODIFICABILI) {
    if (campo in body) patch[campo] = body[campo];
  }

  if ("tipo" in patch && !TIPI.has(patch.tipo as string)) {
    return NextResponse.json({ error: "Tipo transazione non valido." }, { status: 400 });
  }
  if ("quantita" in patch) {
    const quantitaNum = Number(patch.quantita);
    if (!Number.isFinite(quantitaNum) || quantitaNum <= 0) {
      return NextResponse.json({ error: "Quantità non valida." }, { status: 400 });
    }
    patch.quantita = quantitaNum;
  }
  if ("prezzo_unitario" in patch) {
    const raw = patch.prezzo_unitario;
    if (raw === null || raw === "" || raw === undefined) {
      patch.prezzo_unitario = null;
    } else {
      const prezzoNum = Number(raw);
      if (!Number.isFinite(prezzoNum)) {
        return NextResponse.json({ error: "Prezzo unitario non valido." }, { status: 400 });
      }
      patch.prezzo_unitario = prezzoNum;
    }
  }
  if ("costo_tipo" in patch && !COSTO_TIPI.has(patch.costo_tipo as string)) {
    return NextResponse.json({ error: "Tipo di costo non valido." }, { status: 400 });
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nessun campo da aggiornare." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("transazioni").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("transazioni").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
