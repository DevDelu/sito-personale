import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";

type ConfirmRow = {
  asset_id: string;
  tipo: "buy" | "sell";
  quantita: number;
  prezzo_unitario: number | null;
  data: string;
  costo_tipo: "verificato" | "stimato" | "sconosciuto";
  note: string | null;
};

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const righe: ConfirmRow[] = Array.isArray(body?.righe) ? body.righe : [];
  if (righe.length === 0) {
    return NextResponse.json({ error: "Nessuna riga da importare." }, { status: 400 });
  }

  const insert = righe.map((r) => ({
    asset_id: r.asset_id,
    tipo: r.tipo,
    quantita: r.quantita,
    prezzo_unitario: r.prezzo_unitario,
    data: r.data,
    costo_tipo: r.costo_tipo,
    note: r.note,
  }));

  const admin = createAdminClient();
  const { error } = await admin.from("transazioni").insert(insert);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inserted: insert.length });
}
