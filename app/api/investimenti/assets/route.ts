import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const TIPI_ASSET = new Set(["stock", "etf", "indice", "crypto"]);

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corpo della richiesta non valido." }, { status: 400 });
  }

  const ticker = typeof body.ticker === "string" ? body.ticker.trim() : "";
  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  const isin = typeof body.isin === "string" && body.isin.trim() ? body.isin.trim() : null;
  const tipo = body.tipo;

  if (!ticker) return NextResponse.json({ error: "Ticker mancante." }, { status: 400 });
  if (!nome) return NextResponse.json({ error: "Nome mancante." }, { status: 400 });
  if (!TIPI_ASSET.has(tipo)) return NextResponse.json({ error: "Tipo asset non valido." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("assets")
    .insert({ ticker, nome, isin, tipo, valuta: "EUR" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
