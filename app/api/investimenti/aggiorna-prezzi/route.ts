import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { aggiornaPrezzi } from "@/lib/investimenti/aggiorna-prezzi";

// Aggiornamento prezzi on demand, chiamato da /investimenti all'apertura
// (se l'ultimo è vecchio) e dal pulsante "Aggiorna". Solo owner: la
// protezione è centrale nel proxy (lib/supabase/proxy.ts), e da POST il
// tester in sola lettura viene rifiutato.
export async function POST() {
  try {
    const esito = await aggiornaPrezzi();
    revalidatePath("/investimenti");
    return NextResponse.json({ aggiornati: esito.aggiornati.length, errori: esito.errori });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
