import { NextResponse } from "next/server";
import { getPastiByData } from "@/lib/alimentazione/queries";
import { oggiItaliaISO } from "@/lib/cron/data-italia";
import { sendPushToOwner } from "@/lib/push/send";

// Cron giornaliero (vercel.json, ~21:30 Italia): stessa logica del
// promemoria pranzo, per la cena.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
    }
  }

  const oggi = oggiItaliaISO();
  const pasti = await getPastiByData(oggi);
  const giaLoggato = pasti.some((p) => p.tipo_pasto === "cena");

  if (giaLoggato) {
    return NextResponse.json({ ok: true, inviata: false, motivo: "cena già registrata" });
  }

  const risultato = await sendPushToOwner({
    title: "Cena non loggata",
    body: "Non hai ancora registrato la cena di oggi.",
    url: "/alimentazione/aggiungi",
    tag: "alimentazione-cena",
  });

  return NextResponse.json({ inviata: true, risultato });
}
