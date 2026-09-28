import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { isOwner } from "@/lib/supabase/owner";
import {
  feedbackApertiSuRoute,
  feedbackDaVerificare,
  inserisciFeedback,
  isTabellaMancante,
} from "@/lib/feedback/queries";
import { paginaTemplate } from "@/lib/feedback/pagina";
import { validaFeedback } from "@/lib/feedback/validazione";

// Feedback dall'area privata (sheet aperto da tab bar, /altro, sidebar o
// suggerimento dopo un attrito). L'owner è già garantito dal proxy
// (lib/supabase/proxy.ts); il controllo qui resta come seconda barriera:
// un giocatore del quiz con login Google ha comunque una sessione Supabase
// valida (vedi CLAUDE.md), il tester passa il proxy solo in GET.

function errore(error: unknown) {
  // 503 e non 500: il client tiene il feedback nella coda locale e lo
  // reinvia quando le migration 031/033 saranno applicate.
  if (isTabellaMancante(error as { code?: string; message?: string })) {
    return NextResponse.json({ error: "Feedback non ancora configurato sul server." }, { status: 503 });
  }
  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  if (!isOwner(user.email)) return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });

  const payload = validaFeedback(await request.json().catch(() => null));
  if (!payload) return NextResponse.json({ error: "Feedback non valido." }, { status: 400 });

  try {
    const esito = await inserisciFeedback(payload);
    // Nota su un feedback chiuso/eliminato nel frattempo: 400, il client non
    // la ritenta (l'alternativa sarebbe perderla in silenzio in coda).
    if (!esito.ok) return NextResponse.json({ error: "Feedback non più aperto." }, { status: 400 });
    return NextResponse.json({ ok: true, id: esito.id });
  } catch (error) {
    return errore(error);
  }
}

// GET /api/feedback?route=/spese/gestione → segnalazioni non chiuse su
//   quella pagina ("Qui hai già N segnalazioni aperte").
// GET /api/feedback?stato=da-verificare → per l'avviso di verifica.
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const params = new URL(request.url).searchParams;
  try {
    if (params.get("stato") === "da-verificare") {
      return NextResponse.json({ feedback: await feedbackDaVerificare() });
    }
    const route = params.get("route");
    if (route) return NextResponse.json({ feedback: await feedbackApertiSuRoute(paginaTemplate(route)) });
    return NextResponse.json({ error: "Serve route o stato." }, { status: 400 });
  } catch (error) {
    // Migration non ancora applicata: nessun avviso, nessun doppione.
    if (isTabellaMancante(error as { code?: string; message?: string })) return NextResponse.json({ feedback: [] });
    return errore(error);
  }
}
