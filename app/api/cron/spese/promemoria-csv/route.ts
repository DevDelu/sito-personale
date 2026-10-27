import { NextResponse } from "next/server";
import { rifiutaSeNonCron } from "@/lib/cron/auth";
import { sendPushToOwner } from "@/lib/push/send";

// Cron settimanale (vercel.json, domenica ~18:00 Italia): promemoria "alla
// cieca" per l'upload manuale dei CSV spese, senza controllo di stato — il
// flusso di import (manuale o via /api/spese/importa/grezzo) non ha un modo
// semplice e affidabile per sapere se "questa settimana" è già stata
// caricata. Se in futuro serve renderlo condizionale (es. controllando
// l'ultima transazione importata), è un lavoro a parte.
export async function GET(request: Request) {
  const rifiutata = rifiutaSeNonCron(request);
  if (rifiutata) return rifiutata;

  const risultato = await sendPushToOwner({
    title: "Upload spese settimanale",
    body: "Ricordati di caricare i CSV di questa settimana.",
    url: "/spese",
    tag: "spese-csv",
  });

  return NextResponse.json({ inviata: true, risultato });
}
