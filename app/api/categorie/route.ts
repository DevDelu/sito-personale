import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { pickCategoryColor } from "@/lib/category-palette";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  const tipo = body?.tipo === "entrata" ? "entrata" : body?.tipo === "spesa" ? "spesa" : null;

  if (!nome) return NextResponse.json({ error: "Il nome della categoria è obbligatorio." }, { status: 400 });
  if (!tipo) return NextResponse.json({ error: "Tipo categoria non valido." }, { status: 400 });

  const admin = createAdminClient();

  const { data: esistenti, error: fetchError } = await admin
    .from("categorie")
    .select("id, nome, colore, tipo");
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const giaEsistente = (esistenti ?? []).find(
    (c) => c.tipo === tipo && c.nome.toLowerCase() === nome.toLowerCase()
  );
  if (giaEsistente) return NextResponse.json({ categoria: giaEsistente });

  const colore = pickCategoryColor((esistenti ?? []).map((c) => c.colore));

  const { data: nuova, error } = await admin
    .from("categorie")
    .insert({ nome, tipo, colore })
    .select("id, nome, colore, tipo")
    .single();

  if (error) {
    // 23505 = violazione unique (nome, tipo): un'altra richiesta l'ha creata nel frattempo.
    if (error.code === "23505") {
      const { data: concorrente } = await admin
        .from("categorie")
        .select("id, nome, colore, tipo")
        .eq("tipo", tipo)
        .ilike("nome", nome)
        .maybeSingle();
      if (concorrente) return NextResponse.json({ categoria: concorrente });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Invalida la Router Cache di Next.js sulle altre pagine del modulo Spese,
  // così una categoria creata da "aggiungi spesa" compare subito anche in
  // Overview/Gestione senza affidarsi solo al refetch della navigazione.
  revalidatePath("/spese");
  revalidatePath("/spese/gestione");

  return NextResponse.json({ categoria: nuova });
}
