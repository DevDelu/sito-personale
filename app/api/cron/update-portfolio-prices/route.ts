import { NextResponse } from "next/server";
import { aggiornaPrezzi } from "@/lib/investimenti/aggiorna-prezzi";

// Cron giornaliero (vercel.json): vedi aggiornaPrezzi(). Torna nella
// risposta l'elenco di successi/errori.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
    }
  }

  try {
    return NextResponse.json(await aggiornaPrezzi());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
