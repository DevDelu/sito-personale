import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { suggestCategoria } from "@/lib/suggest-categoria";
import type { TipoCategoria } from "@/lib/types";

// PLACEHOLDER: risponde con un'euristica locale a parole chiave (vedi
// lib/suggest-categoria.ts), nessuna chiamata all'API Anthropic. Quando sarà
// disponibile una ANTHROPIC_API_KEY, sostituire solo il corpo di
// suggestCategoria con una vera chiamata a Claude: questa route e la sua
// risposta JSON restano identiche.
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const descrizione = typeof body?.descrizione === "string" ? body.descrizione : "";
  const tipo: TipoCategoria = body?.tipo === "entrata" ? "entrata" : "spesa";

  const categoria = suggestCategoria(descrizione, tipo);
  return NextResponse.json({ categoria });
}
