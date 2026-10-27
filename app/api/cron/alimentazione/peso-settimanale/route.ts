import { NextResponse } from "next/server";
import { rifiutaSeNonCron } from "@/lib/cron/auth";
import { getPesoCorporeoTraDate } from "@/lib/alimentazione/queries";
import { settimanaCorrenteItalia } from "@/lib/cron/data-italia";
import { sendPushToOwner } from "@/lib/push/send";

// Cron settimanale (vercel.json, domenica ~09:00 Italia): se manca una
// pesata nella settimana corrente (lun-dom, Europe/Rome), promemoria push.
export async function GET(request: Request) {
  const rifiutata = rifiutaSeNonCron(request);
  if (rifiutata) return rifiutata;

  const { inizio, fine } = settimanaCorrenteItalia();
  const pesate = await getPesoCorporeoTraDate(inizio, fine);

  if (pesate.length > 0) {
    return NextResponse.json({ ok: true, inviata: false, motivo: "pesata già registrata questa settimana" });
  }

  const risultato = await sendPushToOwner({
    title: "Peso corporeo non registrato",
    body: "Non hai ancora registrato il peso di questa settimana.",
    url: "/alimentazione/profilo",
    tag: "alimentazione-peso",
  });

  return NextResponse.json({ inviata: true, risultato });
}
