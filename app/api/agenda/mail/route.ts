import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/agenda/crypto";
import { GoogleReauthRequiredError, fetchMailByDate, refreshAccessToken } from "@/lib/agenda/google-client";

// Sola lettura, nessuna scrittura su Supabase: il risultato non va mai
// persistito (vedi brief modulo Agenda §4.7). Chiamata lazy dalla tab Posta
// del pannello giorno, non al caricamento della pagina.
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const data = request.nextUrl.searchParams.get("data");
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return NextResponse.json({ error: "Parametro data non valido (atteso YYYY-MM-DD)." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: integrazione, error: integrError } = await admin
    .from("integrazione_google")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (integrError) return NextResponse.json({ error: integrError.message }, { status: 500 });
  if (!integrazione || integrazione.stato !== "connesso" || !integrazione.refresh_token_enc) {
    return NextResponse.json({ error: "Google non è collegato.", reauth_required: true }, { status: 401 });
  }

  try {
    const refreshToken = decryptToken(integrazione.refresh_token_enc);
    const tokens = await refreshAccessToken(refreshToken);
    const mail = await fetchMailByDate(tokens.access_token, data);
    return NextResponse.json(mail);
  } catch (e) {
    if (e instanceof GoogleReauthRequiredError) {
      await admin.from("integrazione_google").update({ stato: "scaduto" }).eq("id", integrazione.id);
      return NextResponse.json({ error: e.message, reauth_required: true }, { status: 401 });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
