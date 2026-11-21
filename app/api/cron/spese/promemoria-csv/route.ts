import { NextResponse } from "next/server";
import { rifiutaSeNonCron } from "@/lib/cron/auth";
import { sendPushToOwner } from "@/lib/push/send";
import { getUltimoInserimentoImport } from "@/lib/spese/queries";
import { serveIlPromemoria } from "@/lib/spese/ultimo-import";

// Cron settimanale (vercel.json, domenica ~18:00 Italia): promemoria per
// l'upload manuale dei CSV spese. Non parte se l'ultimo import è di meno di
// SOGLIA_PROMEMORIA_GIORNI giorni (lib/spese/ultimo-import.ts). Se la lettura
// dell'ultimo import fallisce, il promemoria parte comunque.
export async function GET(request: Request) {
  const rifiutata = rifiutaSeNonCron(request);
  if (rifiutata) return rifiutata;

  const ultimo = await getUltimoInserimentoImport().catch(() => null);
  if (!serveIlPromemoria(ultimo)) {
    return NextResponse.json({ inviata: false, motivo: "import recente" });
  }

  const risultato = await sendPushToOwner({
    title: "Upload spese settimanale",
    body: "Ricordati di caricare i CSV di questa settimana.",
    url: "/spese",
    tag: "spese-csv",
  });

  return NextResponse.json({ inviata: true, risultato });
}
