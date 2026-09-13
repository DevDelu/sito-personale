import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { aggiornaPasto, eliminaPasto } from "@/lib/alimentazione/queries";
import type { TipoPasto } from "@/lib/alimentazione/types";

const TIPI_PASTO: TipoPasto[] = ["colazione", "pranzo", "cena", "spuntino"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corpo della richiesta non valido." }, { status: 400 });
  }

  const patch: {
    data?: string;
    tipoPasto?: TipoPasto;
    quantitaG?: number;
    note?: string | null;
  } = {};

  if (typeof body.data === "string" && body.data) patch.data = body.data;
  if (typeof body.tipoPasto === "string" && TIPI_PASTO.includes(body.tipoPasto as TipoPasto)) {
    patch.tipoPasto = body.tipoPasto as TipoPasto;
  }
  if (body.quantitaG !== undefined) {
    const quantita = Number(body.quantitaG);
    if (!Number.isFinite(quantita) || quantita <= 0) {
      return NextResponse.json({ error: "La quantità deve essere un numero positivo." }, { status: 400 });
    }
    patch.quantitaG = quantita;
  }
  if ("note" in body) patch.note = typeof body.note === "string" ? body.note : null;

  try {
    await aggiornaPasto(id, patch);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { id } = await params;
  try {
    await eliminaPasto(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
