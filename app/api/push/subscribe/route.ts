import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { isOwner } from "@/lib/supabase/owner";
import { isTabellaMancante, salvaSubscription } from "@/lib/push/queries";

// web-push (e in generale l'invio push) non gira su Edge: tutte le route
// sotto app/api/push/* forzano il runtime Node.js.
export const runtime = "nodejs";

// Solo l'owner può registrare device per le notifiche private: getUser()
// da solo non basta, un giocatore del quiz con login Google avrebbe
// comunque una sessione Supabase valida (vedi CLAUDE.md).
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  if (!isOwner(user.email)) return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const auth = typeof body?.keys?.auth === "string" ? body.keys.auth : "";

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Subscription non valida." }, { status: 400 });
  }

  try {
    await salvaSubscription({ endpoint, keys: { p256dh, auth } }, request.headers.get("user-agent"));
  } catch (error) {
    if (isTabellaMancante(error as { code?: string; message?: string })) {
      return NextResponse.json({ error: "Notifiche non ancora configurate sul server." }, { status: 503 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
