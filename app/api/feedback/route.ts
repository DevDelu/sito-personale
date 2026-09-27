import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { isOwner } from "@/lib/supabase/owner";
import { inserisciFeedback, isTabellaMancante } from "@/lib/feedback/queries";
import { validaFeedback } from "@/lib/feedback/validazione";

// Feedback dall'area privata (sheet aperto da tab bar, /altro, sidebar o
// suggerimento dopo un attrito). Solo owner: un giocatore del quiz con login
// Google ha comunque una sessione Supabase valida (vedi CLAUDE.md).
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  if (!isOwner(user.email)) return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });

  const payload = validaFeedback(await request.json().catch(() => null));
  if (!payload) return NextResponse.json({ error: "Feedback non valido." }, { status: 400 });

  try {
    await inserisciFeedback(payload);
  } catch (error) {
    // 503 e non 500: il client tiene il feedback nella coda locale e lo
    // reinvia quando la migration 031_feedback.sql sarà applicata.
    if (isTabellaMancante(error as { code?: string; message?: string })) {
      return NextResponse.json({ error: "Feedback non ancora configurato sul server." }, { status: 503 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
