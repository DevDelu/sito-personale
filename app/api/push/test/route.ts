import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { isOwner } from "@/lib/supabase/owner";
import { sendPushToOwner } from "@/lib/push/send";

export const runtime = "nodejs";

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  if (!isOwner(user.email)) return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });

  const risultato = await sendPushToOwner({
    title: "Radar",
    body: "Notifica di prova: se la vedi, il pipe push funziona.",
    tag: "test",
  });

  // vapid_non_configurato/tabella_mancante: "server non configurato", il
  // caso che la UI in Impostazioni deve distinguere per disabilitare i
  // pulsanti invece di mostrare un errore generico.
  if (!risultato.ok && (risultato.reason === "vapid_non_configurato" || risultato.reason === "tabella_mancante")) {
    return NextResponse.json(risultato, { status: 503 });
  }

  return NextResponse.json(risultato);
}
