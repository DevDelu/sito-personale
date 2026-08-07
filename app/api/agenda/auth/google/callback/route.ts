import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptToken } from "@/lib/agenda/crypto";
import { exchangeCodeForTokens } from "@/lib/agenda/google-client";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = request.cookies.get("google_oauth_state")?.value;
  const googleError = searchParams.get("error");

  if (googleError) {
    return NextResponse.redirect(new URL(`/agenda?google_error=${encodeURIComponent(googleError)}`, request.url));
  }
  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(new URL("/agenda?google_error=state_non_valido", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Non dovrebbe succedere con prompt=consent, ma se manca non c'è nulla
      // da salvare per la sync: meglio segnalarlo che scrivere uno stato
      // "connesso" senza refresh token, che romperebbe la sync al primo giro.
      return NextResponse.redirect(new URL("/agenda?google_error=refresh_token_mancante", request.url));
    }

    const admin = createAdminClient();
    const { data: esistente } = await admin.from("integrazione_google").select("id").limit(1).maybeSingle();

    const riga = {
      refresh_token_enc: encryptToken(tokens.refresh_token),
      access_token: tokens.access_token,
      access_token_scadenza: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      stato: "connesso" as const,
    };

    if (esistente) {
      await admin.from("integrazione_google").update(riga).eq("id", esistente.id);
    } else {
      await admin.from("integrazione_google").insert(riga);
    }

    const res = NextResponse.redirect(new URL("/agenda", request.url));
    res.cookies.delete("google_oauth_state");
    return res;
  } catch {
    // Mai includere il code/token nel redirect o nei log.
    return NextResponse.redirect(new URL("/agenda?google_error=scambio_codice_fallito", request.url));
  }
}
