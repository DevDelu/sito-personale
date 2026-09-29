import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  aggiungiEventoA,
  cambiaStato,
  eventiDaRiportare,
  feedbackCompleto,
  isTabellaMancante,
  listaFeedback,
  listaFeedbackPerStato,
  segnaRiportati,
} from "@/lib/feedback/queries";
import { isUuid } from "@/lib/feedback/validazione";
import { EVENTO_TESTO_MAX, FEEDBACK_STATI, type FeedbackStato } from "@/lib/feedback/types";

export const runtime = "nodejs";

// Endpoint per gli agenti (job notturno radar-feedback-notte.yml, workflow
// feedback-pr.yml e feedback-deploy.yml), non per il browser: il tester è
// in sola lettura e la service role key non esce mai da Vercel, quindi gli
// agenti passano da qui con un secret dedicato. A differenza dei cron
// (CRON_SECRET opzionale), qui il secret è obbligatorio: la route espone il
// testo dei feedback.
//
// Nome del secret: FEEDBACK_AGENTE_SECRET (quello già in uso);
// FEEDBACK_AGENT_SECRET è accettato come alias.
function secret(): string | undefined {
  return process.env.FEEDBACK_AGENTE_SECRET || process.env.FEEDBACK_AGENT_SECRET || undefined;
}

function autorizzato(request: Request): boolean | null {
  const s = secret();
  if (!s) return null;
  const atteso = Buffer.from(`Bearer ${s}`);
  const ricevuto = Buffer.from(request.headers.get("authorization") ?? "");
  return atteso.length === ricevuto.length && timingSafeEqual(atteso, ricevuto);
}

function errore(error: unknown) {
  if (isTabellaMancante(error as { code?: string; message?: string })) {
    return NextResponse.json({ error: "Tabelle feedback mancanti (migration 031/033)." }, { status: 503 });
  }
  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
}

function controlla(request: Request) {
  const esito = autorizzato(request);
  if (esito === null) return NextResponse.json({ error: "FEEDBACK_AGENTE_SECRET non impostata." }, { status: 503 });
  if (!esito) return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  return null;
}

// GET /api/feedback/agente?stato=nuovo            → feedback in quello stato
// GET /api/feedback/agente?stato=tutti            → tutti (ultimi 300)
// GET /api/feedback/agente?id=<uuid>              → un feedback + tutta la
//                                                   sua storia (note, risposte)
// GET /api/feedback/agente?eventi=da-riportare    → note/risposte di Lorenzo
//                                                   da riportare nella issue
// Il testo è sempre quello originale, completo: chi ha il secret legge
// esattamente cosa ha scritto Lorenzo (scripts/feedback.mjs).
export async function GET(request: Request) {
  const negato = controlla(request);
  if (negato) return negato;

  const params = new URL(request.url).searchParams;
  try {
    if (params.get("eventi") === "da-riportare") {
      return NextResponse.json({ eventi: await eventiDaRiportare() });
    }
    const id = params.get("id");
    if (id !== null) {
      if (!isUuid(id)) return NextResponse.json({ error: "Id non valido." }, { status: 400 });
      const completo = await feedbackCompleto(id);
      if (!completo) return NextResponse.json({ error: "Feedback non trovato." }, { status: 404 });
      return NextResponse.json(completo);
    }
    if (params.get("stato") === "tutti") {
      return NextResponse.json({ feedback: await listaFeedback() });
    }
    const stato = params.get("stato") ?? "nuovo";
    if (!FEEDBACK_STATI.includes(stato as FeedbackStato)) {
      return NextResponse.json({ error: "Stato non valido." }, { status: 400 });
    }
    return NextResponse.json({ feedback: await listaFeedbackPerStato(stato as FeedbackStato) });
  } catch (error) {
    return errore(error);
  }
}

function intero(v: unknown): number | undefined {
  return Number.isInteger(v) && (v as number) > 0 ? (v as number) : undefined;
}

function testo(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, EVENTO_TESTO_MAX) : null;
}

// POST /api/feedback/agente (PATCH accettato per compatibilità)
//   { id, stato: "preso-in-carico", issue_number }            job notturno
//   { issue_number, stato: "serve-info", testo: "domanda" }   agente
//   { issue_number, stato: "in-lavorazione", pr_number }      PR aperta
//   { issue_number, stato: "preso-in-carico" }                PR chiusa senza merge / riaperto
//   { id, stato: "da-verificare", autore: "sistema" }         deploy di produzione
//   { issue_number, evento: "nota-fix", testo }               PR mergiata
//   { riportati: [id evento, ...] }                           note riportate nella issue
// Gli agenti non possono mai impostare `verificato` né `scartato` (403):
// la matrice è in lib/feedback/stati.ts.
export async function POST(request: Request) {
  const negato = controlla(request);
  if (negato) return negato;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body non valido." }, { status: 400 });

  try {
    if (Array.isArray(body.riportati)) {
      const ids = body.riportati.filter(isUuid).slice(0, 100);
      return NextResponse.json({ aggiornati: await segnaRiportati(ids) });
    }

    const issue = intero(body.issue_number);
    const pr = intero(body.pr_number);
    const id = isUuid(body.id) ? body.id : undefined;
    if (!id && !issue) return NextResponse.json({ error: "Serve id o issue_number." }, { status: 400 });
    const filtro = id ? { id } : { issue_number: issue! };

    if (body.evento === "nota-fix") {
      const t = testo(body.testo);
      if (!t) return NextResponse.json({ error: "La nota-fix richiede un testo." }, { status: 400 });
      return NextResponse.json({ aggiornati: await aggiungiEventoA(filtro, "agente", "nota-fix", t) });
    }

    const stato = body.stato as FeedbackStato | undefined;
    if (!stato || !FEEDBACK_STATI.includes(stato)) {
      return NextResponse.json({ error: "Stato non valido." }, { status: 400 });
    }
    const autore = body.autore === "sistema" ? "sistema" : "agente";
    const domanda = stato === "serve-info" ? testo(body.testo) : null;
    if (stato === "serve-info" && !domanda) {
      return NextResponse.json({ error: "serve-info richiede una domanda in `testo`." }, { status: 400 });
    }

    const esito = await cambiaStato(filtro, stato, autore, {
      testo: domanda ?? testo(body.testo),
      tipoEvento: domanda ? "domanda" : "cambio-stato",
      issue_number: issue,
      pr_number: pr,
    });
    if (!esito.ok) {
      const status = esito.motivo === "vietato" ? 403 : esito.motivo === "non-trovato" ? 404 : 409;
      return NextResponse.json({ error: esito.messaggio }, { status });
    }
    return NextResponse.json({ aggiornati: esito.aggiornati, invariati: esito.invariati });
  } catch (error) {
    return errore(error);
  }
}

export const PATCH = POST;
