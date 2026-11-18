import { rifiutaSeNonAgente } from "@/lib/agenti/secret";
import { inserisciResoconto } from "@/lib/novita/queries";
import { sendPushToOwner } from "@/lib/push/send";

export const runtime = "nodejs";

// POST /api/resoconti/agente — resoconto di fine turno delle routine degli
// agenti (scripts/resoconto.mjs), al posto della newsletter via email.
// Salva il testo (Markdown semplice) e manda una notifica che lo apre.
// Risponde { id, notificato }: se la notifica non è partita (push non
// attive sul telefono) lo script ripiega sull'email, così il resoconto
// arriva comunque.
//
// Corpo: { turno, titolo, testo, azioni_per_te?, anteprima? }

export async function POST(request: Request) {
  const negato = rifiutaSeNonAgente(request);
  if (negato) return negato;

  const c = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const turno = typeof c?.turno === "string" ? c.turno.trim().slice(0, 60) : "";
  const titolo = typeof c?.titolo === "string" ? c.titolo.trim().slice(0, 200) : "";
  const testo = typeof c?.testo === "string" ? c.testo.trim().slice(0, 30000) : "";
  const azioni = Number.isInteger(c?.azioni_per_te) ? Math.max(0, c!.azioni_per_te as number) : 0;
  const anteprima = typeof c?.anteprima === "string" ? c.anteprima.trim().slice(0, 140) : "";
  if (!turno || !titolo || !testo) return Response.json({ error: "Servono turno, titolo e testo." }, { status: 400 });

  try {
    const id = await inserisciResoconto({ turno, titolo, testo, azioni_per_te: azioni });
    const push = await sendPushToOwner({
      title: azioni > 0 ? `Resoconto: ${azioni} ${azioni === 1 ? "cosa" : "cose"} per te` : "Resoconto del team",
      body: anteprima || titolo,
      url: `/novita/resoconti/${id}`,
      tag: "resoconto",
    });
    return Response.json({ id, notificato: push.ok, motivo: push.ok ? null : push.reason });
  } catch (e) {
    console.error("[resoconti] inserimento", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
