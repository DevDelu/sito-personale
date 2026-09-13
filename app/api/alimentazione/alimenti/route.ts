import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { creaAlimento } from "@/lib/alimentazione/queries";

// Creazione inline di un alimento dal flusso "aggiungi pasto", stesso
// pattern di POST /api/categorie (creazione inline categoria in Spese):
// se un alimento con lo stesso nome esiste già, creaAlimento() lo restituisce
// invece di duplicarlo.
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  const kcal100g = Number(body?.kcal100g);
  const proteine100g = Number(body?.proteine100g ?? 0);
  const carboidrati100g = Number(body?.carboidrati100g ?? 0);
  const grassi100g = Number(body?.grassi100g ?? 0);

  if (!nome) return NextResponse.json({ error: "Il nome dell'alimento è obbligatorio." }, { status: 400 });
  if (!Number.isFinite(kcal100g) || kcal100g < 0) {
    return NextResponse.json({ error: "Le kcal per 100g devono essere un numero non negativo." }, { status: 400 });
  }
  for (const [label, v] of [
    ["proteine", proteine100g],
    ["carboidrati", carboidrati100g],
    ["grassi", grassi100g],
  ] as const) {
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json({ error: `Il valore per ${label} non è valido.` }, { status: 400 });
    }
  }

  try {
    const alimento = await creaAlimento({ nome, kcal100g, proteine100g, carboidrati100g, grassi100g });
    return NextResponse.json({ alimento });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
