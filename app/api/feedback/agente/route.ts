import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { aggiornaFeedback, isTabellaMancante, listaFeedbackPerStato } from "@/lib/feedback/queries";
import { FEEDBACK_STATI, type FeedbackStato } from "@/lib/feedback/types";

export const runtime = "nodejs";

// Endpoint per gli agenti (job notturno di radar-daily e workflow
// feedback-risolto.yml), non per il browser: il tester è in sola lettura e
// la service role key non esce mai da Vercel, quindi gli agenti passano da
// qui con un secret dedicato. A differenza dei cron (CRON_SECRET opzionale),
// qui il secret è obbligatorio: la route espone il testo dei feedback.
function autorizzato(request: Request): boolean | null {
  const secret = process.env.FEEDBACK_AGENTE_SECRET;
  if (!secret) return null;
  const atteso = Buffer.from(`Bearer ${secret}`);
  const ricevuto = Buffer.from(request.headers.get("authorization") ?? "");
  return atteso.length === ricevuto.length && timingSafeEqual(atteso, ricevuto);
}

function errore(error: unknown) {
  if (isTabellaMancante(error as { code?: string; message?: string })) {
    return NextResponse.json({ error: "Tabella feedback mancante (migration 031)." }, { status: 503 });
  }
  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
}

function controlla(request: Request) {
  const esito = autorizzato(request);
  if (esito === null) return NextResponse.json({ error: "FEEDBACK_AGENTE_SECRET non impostata." }, { status: 503 });
  if (!esito) return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  return null;
}

// GET /api/feedback/agente?stato=nuovo → feedback da trasformare in issue.
export async function GET(request: Request) {
  const negato = controlla(request);
  if (negato) return negato;

  const stato = new URL(request.url).searchParams.get("stato") ?? "nuovo";
  if (!FEEDBACK_STATI.includes(stato as FeedbackStato)) {
    return NextResponse.json({ error: "Stato non valido." }, { status: 400 });
  }

  try {
    return NextResponse.json({ feedback: await listaFeedbackPerStato(stato as FeedbackStato) });
  } catch (error) {
    return errore(error);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function intero(v: unknown): number | undefined {
  return Number.isInteger(v) && (v as number) > 0 ? (v as number) : undefined;
}

// PATCH /api/feedback/agente
//   { id, stato: "in-lavorazione", issue_number }       → dopo la issue
//   { issue_number, stato: "risolto", pr_number }       → dopo il merge
export async function PATCH(request: Request) {
  const negato = controlla(request);
  if (negato) return negato;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body non valido." }, { status: 400 });

  const stato = body.stato as FeedbackStato | undefined;
  if (stato !== undefined && !FEEDBACK_STATI.includes(stato)) {
    return NextResponse.json({ error: "Stato non valido." }, { status: 400 });
  }
  const issue = intero(body.issue_number);
  const pr = intero(body.pr_number);
  const id = typeof body.id === "string" && UUID.test(body.id) ? body.id : undefined;

  if (!id && !issue) return NextResponse.json({ error: "Serve id o issue_number." }, { status: 400 });

  const modifiche = {
    ...(stato ? { stato } : {}),
    ...(id && issue ? { issue_number: issue } : {}),
    ...(pr ? { pr_number: pr } : {}),
  };
  if (Object.keys(modifiche).length === 0) {
    return NextResponse.json({ error: "Nessuna modifica." }, { status: 400 });
  }

  try {
    const aggiornati = await aggiornaFeedback(id ? { id } : { issue_number: issue! }, modifiche);
    return NextResponse.json({ aggiornati });
  } catch (error) {
    return errore(error);
  }
}
