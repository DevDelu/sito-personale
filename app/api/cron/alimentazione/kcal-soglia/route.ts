import { NextResponse } from "next/server";
import { getPastiByData, getRiepilogoTdee } from "@/lib/alimentazione/queries";
import { oggiItaliaISO } from "@/lib/cron/data-italia";
import { sendPushToOwner } from "@/lib/push/send";

// Soglia di scostamento dal target kcal oltre la quale scatta l'alert
// (percentuale del target). Costante qui, non env: valore facilmente
// modificabile senza toccare la configurazione di deploy.
const SOGLIA_SCOSTAMENTO_PERCENTUALE = 20;

// Cron giornaliero (vercel.json, ~23:00 Italia): confronta le kcal
// effettivamente loggate oggi con il target TDEE di fase. Zero pasti loggati
// non genera alert (già coperto dai promemoria pranzo/cena, evita doppioni).
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

  if (pasti.length === 0) {
    return NextResponse.json({ ok: true, inviata: false, motivo: "nessun pasto loggato oggi" });
  }

  const riepilogo = await getRiepilogoTdee();
  if (!riepilogo.ok) {
    return NextResponse.json({ ok: true, inviata: false, motivo: `TDEE non calcolabile (${riepilogo.motivo})` });
  }

  const kcalTotali = pasti.reduce((somma, p) => somma + p.kcal, 0);
  const scarto = kcalTotali - riepilogo.targetKcal;
  const sogliaKcal = riepilogo.targetKcal * (SOGLIA_SCOSTAMENTO_PERCENTUALE / 100);

  if (Math.abs(scarto) <= sogliaKcal) {
    return NextResponse.json({ ok: true, inviata: false, motivo: "entro soglia", kcalTotali, target: riepilogo.targetKcal });
  }

  const scartoArrotondato = Math.round(Math.abs(scarto));
  const body =
    scarto > 0
      ? `Oggi ${scartoArrotondato} kcal sopra target.`
      : `Oggi ${scartoArrotondato} kcal sotto target.`;

  const risultato = await sendPushToOwner({
    title: "Kcal fuori target",
    body,
    url: "/alimentazione",
    tag: "alimentazione-kcal",
  });

  return NextResponse.json({ inviata: true, risultato, kcalTotali, target: riepilogo.targetKcal });
}
