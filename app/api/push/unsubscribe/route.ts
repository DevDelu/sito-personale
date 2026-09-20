import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { isOwner } from "@/lib/supabase/owner";
import { isTabellaMancante, rimuoviSubscription } from "@/lib/push/queries";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  if (!isOwner(user.email)) return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) return NextResponse.json({ error: "endpoint mancante." }, { status: 400 });

  try {
    await rimuoviSubscription(endpoint);
  } catch (error) {
    if (isTabellaMancante(error as { code?: string; message?: string })) {
      return NextResponse.json({ error: "Notifiche non ancora configurate sul server." }, { status: 503 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
