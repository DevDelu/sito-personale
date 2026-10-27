import { NextResponse } from "next/server";
import { rifiutaSeNonCron } from "@/lib/cron/auth";
import { aggiornaPrezzi } from "@/lib/investimenti/aggiorna-prezzi";

// Cron giornaliero (vercel.json): vedi aggiornaPrezzi(). Torna nella
// risposta l'elenco di successi/errori.
export async function GET(request: Request) {
  const rifiutata = rifiutaSeNonCron(request);
  if (rifiutata) return rifiutata;

  try {
    return NextResponse.json(await aggiornaPrezzi());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
