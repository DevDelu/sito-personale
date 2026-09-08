import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { QuizQuestionPublic } from "@/lib/quiz/types";

const DOMANDE_PER_PARTITA = 5;

// Service role key: unico modo di leggere quiz_questions (RLS blocca
// anon/authenticated). correct_index ed explain non escono mai da qui: il
// client non deve poter leggere la risposta corretta prima di rispondere.
export async function GET() {
  const ip = await getClientIp();
  if (!checkRateLimit(`quiz-questions:${ip}`, { max: 30, windowMs: 60_000 }).allowed) {
    return NextResponse.json({ error: "Troppe richieste, riprova tra poco." }, { status: 429 });
  }

  type QuizQuestionRow = QuizQuestionPublic & { correct_index: number; explain: string; difficulty: string };

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("quiz_random_questions", { n: DOMANDE_PER_PARTITA });

  if (error || !data) {
    return NextResponse.json({ error: "Impossibile caricare le domande." }, { status: 500 });
  }

  const questions: QuizQuestionPublic[] = (data as QuizQuestionRow[]).map((row) => ({
    id: row.id,
    category: row.category,
    question: row.question,
    options: row.options as string[],
  }));

  return NextResponse.json({ questions });
}
