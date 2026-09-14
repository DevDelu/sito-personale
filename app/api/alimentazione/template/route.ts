import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { creaTemplate, getTemplatePasti } from "@/lib/alimentazione/template";
import type { ComposizioneItem, TipoPasto } from "@/lib/alimentazione/types";

const TIPI_PASTO: TipoPasto[] = ["colazione", "pranzo", "cena", "spuntino"];

function parseComposizione(raw: unknown): ComposizioneItem[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ComposizioneItem[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") return null;
    const alimentoId = (r as Record<string, unknown>).alimento_id;
    const quantitaG = Number((r as Record<string, unknown>).quantita_g);
    if (typeof alimentoId !== "string" || !alimentoId) return null;
    if (!Number.isFinite(quantitaG) || quantitaG <= 0) return null;
    out.push({ alimento_id: alimentoId, quantita_g: quantitaG });
  }
  return out;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  try {
    const templates = await getTemplatePasti();
    return NextResponse.json({ templates });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const giornoSettimana = Number(body?.giornoSettimana);
  const tipoPasto = String(body?.tipoPasto ?? "");
  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  const composizione = parseComposizione(body?.composizione ?? []);
  const note = typeof body?.note === "string" ? body.note.trim() || null : null;

  if (!Number.isInteger(giornoSettimana) || giornoSettimana < 1 || giornoSettimana > 7) {
    return NextResponse.json({ error: "Giorno della settimana non valido." }, { status: 400 });
  }
  if (!TIPI_PASTO.includes(tipoPasto as TipoPasto)) {
    return NextResponse.json({ error: "Tipo pasto non valido." }, { status: 400 });
  }
  if (!nome) return NextResponse.json({ error: "Il nome del template è obbligatorio." }, { status: 400 });
  if (composizione === null) {
    return NextResponse.json({ error: "Composizione non valida." }, { status: 400 });
  }

  try {
    const template = await creaTemplate({
      giornoSettimana,
      tipoPasto: tipoPasto as TipoPasto,
      nome,
      composizione,
      note,
    });
    return NextResponse.json({ template });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
