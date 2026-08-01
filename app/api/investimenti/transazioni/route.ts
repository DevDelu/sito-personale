import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const COSTO_TIPI = new Set(["verificato", "stimato", "sconosciuto"]);
const TIPI = new Set(["buy", "sell"]);

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corpo della richiesta non valido." }, { status: 400 });
  }

  const { asset_id, tipo, quantita, prezzo_unitario, data, costo_tipo, note } = body;

  if (!asset_id || typeof asset_id !== "string") {
    return NextResponse.json({ error: "Asset non valido." }, { status: 400 });
  }
  if (!TIPI.has(tipo)) {
    return NextResponse.json({ error: "Tipo transazione non valido." }, { status: 400 });
  }
  const quantitaNum = Number(quantita);
  if (!Number.isFinite(quantitaNum) || quantitaNum <= 0) {
    return NextResponse.json({ error: "Quantità non valida." }, { status: 400 });
  }
  if (!data || typeof data !== "string") {
    return NextResponse.json({ error: "Data non valida." }, { status: 400 });
  }
  const costoTipoValue = costo_tipo && COSTO_TIPI.has(costo_tipo) ? costo_tipo : "verificato";
  const prezzoNum =
    prezzo_unitario === null || prezzo_unitario === undefined || prezzo_unitario === ""
      ? null
      : Number(prezzo_unitario);
  if (prezzoNum !== null && !Number.isFinite(prezzoNum)) {
    return NextResponse.json({ error: "Prezzo unitario non valido." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("transazioni")
    .insert({
      asset_id,
      tipo,
      quantita: quantitaNum,
      prezzo_unitario: prezzoNum,
      data,
      costo_tipo: costoTipoValue,
      note: note || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(row);
}
