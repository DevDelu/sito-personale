import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Check "in tempo reale" di una singola risposta, usato dalla UI per
// mostrare subito corretto/sbagliato + spiegazione dopo ogni domanda (il
// punteggio finale, quello che conta davvero, resta ricalcolato da zero e
// salvato solo da POST /api/quiz/submit: un client che falsificasse la
// risposta di questa route non guadagnerebbe nulla).
export async function POST(request: Request) {
  const ip = await getClientIp();
  if (!checkRateLimit(`quiz-answer:${ip}`, { max: 60, windowMs: 60_000 }).allowed) {
    return NextResponse.json({ error: "Troppe richieste, riprova tra poco." }, { status: 429 });
  }

  let body: { questionId?: unknown; selectedIndex?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo della richiesta non valido." }, { status: 400 });
  }

  const questionId = body.questionId;
  if (!Number.isInteger(questionId)) {
    return NextResponse.json({ error: "Domanda non valida." }, { status: 400 });
  }
  const selectedIndex =
    typeof body.selectedIndex === "number" && body.selectedIndex >= 0 && body.selectedIndex <= 3
      ? body.selectedIndex
      : null;

  const admin = createAdminClient();
  const { data: question, error } = await admin
    .from("quiz_questions")
    .select("correct_index, explain")
    .eq("id", questionId)
    .maybeSingle();

  if (error || !question) {
    return NextResponse.json({ error: "Domanda non trovata." }, { status: 404 });
  }

  return NextResponse.json({
    correct: selectedIndex === question.correct_index,
    correctIndex: question.correct_index,
    explain: question.explain,
  });
}
