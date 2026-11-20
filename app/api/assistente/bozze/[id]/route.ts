import { rifiutaSeNonOwner } from "@/lib/assistente/accesso";
import { chiudiBozza } from "@/lib/assistente/bozze";

// Conferma/annulla di una bozza dalla card nella pagina /assistente.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const negato = await rifiutaSeNonOwner();
  if (negato) return negato;

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Id non valido." }, { status: 400 });
  const body = (await request.json().catch(() => null)) as { azione?: unknown } | null;
  const azione = body?.azione === "conferma" ? "conferma" : body?.azione === "annulla" ? "annulla" : null;
  if (!azione) return Response.json({ error: "Azione non valida." }, { status: 400 });

  try {
    const esito = await chiudiBozza(id, azione);
    if (!esito.ok) return Response.json({ error: "Già gestita." }, { status: 409 });
    return Response.json({ stato: esito.stato });
  } catch (e) {
    console.error("[assistente] bozza", id, e);
    return Response.json({ error: "Non sono riuscito a salvarla, riprova." }, { status: 500 });
  }
}
