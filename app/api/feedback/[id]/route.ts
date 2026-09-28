import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { eventiFeedback, isTabellaMancante } from "@/lib/feedback/queries";
import { isUuid } from "@/lib/feedback/validazione";

// GET /api/feedback/[id] → timeline del feedback (sheet di dettaglio in
// /feedback). Owner o tester in sola lettura: lo filtra il proxy.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Id non valido." }, { status: 400 });

  try {
    return NextResponse.json({ eventi: await eventiFeedback(id) });
  } catch (error) {
    if (isTabellaMancante(error as { code?: string; message?: string })) return NextResponse.json({ eventi: [] });
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
