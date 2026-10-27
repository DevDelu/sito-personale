import { NextResponse } from "next/server";
import { rifiutaSeNonCron } from "@/lib/cron/auth";
import { getPastiByData } from "@/lib/alimentazione/queries";
import { oggiItaliaISO } from "@/lib/cron/data-italia";
import { sendPushToOwner } from "@/lib/push/send";

// Cron giornaliero (vercel.json, ~14:30 Italia): se non c'è ancora un pasto
// di tipo "pranzo" per oggi, promemoria push. Niente promemoria per la
// colazione (spesso saltata volontariamente) né per lo spuntino.
export async function GET(request: Request) {
  const rifiutata = rifiutaSeNonCron(request);
  if (rifiutata) return rifiutata;

  const oggi = oggiItaliaISO();
  const pasti = await getPastiByData(oggi);
  const giaLoggato = pasti.some((p) => p.tipo_pasto === "pranzo");

  if (giaLoggato) {
    return NextResponse.json({ ok: true, inviata: false, motivo: "pranzo già registrato" });
  }

  const risultato = await sendPushToOwner({
    title: "Pranzo non loggato",
    body: "Non hai ancora registrato il pranzo di oggi.",
    url: "/alimentazione/aggiungi",
    tag: "alimentazione-pranzo",
  });

  return NextResponse.json({ inviata: true, risultato });
}
