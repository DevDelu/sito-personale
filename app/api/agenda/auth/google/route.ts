import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getUser } from "@/lib/supabase/dal";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.readonly",
];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} non impostata: verifica le variabili d'ambiente per il modulo Agenda.`);
  }
  return value;
}

// Avvia il flusso OAuth (o la riconnessione dopo la scadenza a 7 giorni in
// modalità Testing): redirect al consent screen Google.
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const state = randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: requireEnv("GOOGLE_REDIRECT_URI"),
    response_type: "code",
    access_type: "offline",
    // Forza il consent screen anche se già autorizzato in passato: senza
    // questo, Google restituisce un nuovo refresh_token solo alla
    // primissima autorizzazione — serve invece anche per "Riconnetti
    // Google" dopo la scadenza a 7 giorni in modalità Testing.
    prompt: "consent",
    scope: SCOPES.join(" "),
    state,
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
