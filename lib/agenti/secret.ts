import "server-only";
import { timingSafeEqual } from "node:crypto";

// Autorizzazione delle route chiamate da workflow GitHub e routine degli
// agenti: stesso secret di /api/feedback/agente (FEEDBACK_AGENTE_SECRET,
// alias FEEDBACK_AGENT_SECRET), già presente su Vercel e nei secret GitHub.
// Fail-closed: senza secret configurato la route risponde 503 a tutti.
export function rifiutaSeNonAgente(request: Request): Response | null {
  const s = process.env.FEEDBACK_AGENTE_SECRET || process.env.FEEDBACK_AGENT_SECRET;
  if (!s) return Response.json({ error: "FEEDBACK_AGENTE_SECRET non impostata." }, { status: 503 });
  const atteso = Buffer.from(`Bearer ${s}`);
  const ricevuto = Buffer.from(request.headers.get("authorization") ?? "");
  if (atteso.length === ricevuto.length && timingSafeEqual(atteso, ricevuto)) return null;
  return Response.json({ error: "Non autorizzato." }, { status: 401 });
}
