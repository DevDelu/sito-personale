import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { QuizAnswerInput, QuizAnswerResult, QuizSubmitResponse } from "@/lib/quiz/types";

const MAX_DOMANDE = 20;

// Ricalcola il punteggio server-side confrontando le risposte inviate con
// quelle vere lette da quiz_questions (service role key): non ci si fida mai
// di un punteggio calcolato lato client. L'upsert su quiz_attempts avviene
// solo se l'utente è autenticato con Google (ha un profilo con nickname) e
// solo se il nuovo punteggio è il migliore per quell'utente.
export async function POST(request: Request) {
  const ip = await getClientIp();
  if (!checkRateLimit(`quiz-submit:${ip}`, { max: 20, windowMs: 60_000 }).allowed) {
    return NextResponse.json({ error: "Troppe richieste, riprova tra poco." }, { status: 429 });
  }

  let body: { answers?: QuizAnswerInput[]; timeMs?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo della richiesta non valido." }, { status: 400 });
  }

  const answersInput = Array.isArray(body.answers) ? body.answers : [];
  const timeMs = typeof body.timeMs === "number" && body.timeMs >= 0 ? Math.round(body.timeMs) : 0;

  if (answersInput.length === 0 || answersInput.length > MAX_DOMANDE) {
    return NextResponse.json({ error: "Risposte mancanti o non valide." }, { status: 400 });
  }

  const questionIds = answersInput
    .map((a) => a.questionId)
    .filter((id): id is number => Number.isInteger(id));
  if (questionIds.length !== answersInput.length) {
    return NextResponse.json({ error: "Domande non valide." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: questions, error: questionsError } = await admin
    .from("quiz_questions")
    .select("id, correct_index, explain")
    .in("id", questionIds);

  if (questionsError || !questions || questions.length !== questionIds.length) {
    return NextResponse.json({ error: "Domande non trovate." }, { status: 400 });
  }

  const byId = new Map(questions.map((q) => [q.id as number, q]));

  let score = 0;
  const results: QuizAnswerResult[] = answersInput.map((a) => {
    const q = byId.get(a.questionId)!;
    const selectedIndex =
      typeof a.selectedIndex === "number" && a.selectedIndex >= 0 && a.selectedIndex <= 3
        ? a.selectedIndex
        : null;
    const correct = selectedIndex === q.correct_index;
    if (correct) score += 1;
    return {
      questionId: a.questionId,
      correctIndex: q.correct_index,
      selectedIndex,
      correct,
      explain: q.explain,
    };
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let saved = false;
  let rank: number | null = null;

  if (user) {
    const { data: profile } = await admin
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      const { data: attempt } = await admin
        .from("quiz_attempts")
        .select("score, time_taken_ms")
        .eq("user_id", user.id)
        .maybeSingle();

      // Si salva solo il punteggio migliore per utente (upsert), non ogni
      // tentativo: punteggio più alto, a parità di punteggio tempo più
      // basso. Un tentativo peggiore non sovrascrive mai uno già salvato.
      const migliora =
        !attempt || score > attempt.score || (score === attempt.score && timeMs < attempt.time_taken_ms);

      if (migliora) {
        const { error: upsertError } = await admin.from("quiz_attempts").upsert(
          { user_id: user.id, score, time_taken_ms: timeMs, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
        saved = !upsertError;
      } else {
        saved = true;
      }

      const { data: rankRow } = await admin
        .from("quiz_leaderboard")
        .select("rank")
        .eq("nickname", profile.nickname)
        .maybeSingle();
      rank = rankRow?.rank ?? null;
    }
  }

  const response: QuizSubmitResponse = { score, total: answersInput.length, timeMs, saved, rank, results };
  return NextResponse.json(response);
}
