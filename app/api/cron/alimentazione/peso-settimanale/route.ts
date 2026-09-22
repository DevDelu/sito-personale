import { NextResponse } from "next/server";
import { getPesoCorporeoTraDate } from "@/lib/alimentazione/queries";
import { settimanaCorrenteItalia } from "@/lib/cron/data-italia";
import { sendPushToOwner } from "@/lib/push/send";

// Cron settimanale (vercel.json, domenica ~09:00 Italia): se manca una
// pesata nella settimana corrente (lun-dom, Europe/Rome), promemoria push.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
    }
  }

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
