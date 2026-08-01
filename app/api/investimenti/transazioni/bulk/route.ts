import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const COSTO_TIPI = new Set(["verificato", "stimato", "sconosciuto"]);

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
  const costoTipo = body?.costo_tipo;

  if (ids.length === 0) {
    return NextResponse.json({ error: "Nessuna transazione selezionata." }, { status: 400 });
  }
  if (!COSTO_TIPI.has(costoTipo)) {
    return NextResponse.json({ error: "Tipo di costo non valido." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("transazioni").update({ costo_tipo: costoTipo }).in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, count: ids.length });
}

export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "Nessuna transazione selezionata." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("transazioni").delete().in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, count: ids.length });
}
