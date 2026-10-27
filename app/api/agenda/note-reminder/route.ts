import { NextResponse } from "next/server";
import { rifiutaSeNonCron } from "@/lib/cron/auth";
import { Resend } from "resend";
import { getEventiRange, getImpostazioniAgenda, getNotaGiorno } from "@/lib/agenda/queries";
import { componiPushAgenda } from "@/lib/agenda/digest";
import { oggiItaliaISO } from "@/lib/cron/data-italia";
import { sendPushToOwner } from "@/lib/push/send";

function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function formatDataLunga(data: string): string {
  return new Date(`${data}T00:00:00Z`).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

// Il contenuto è HTML (editor rich-text di NotaInline): "vuoto" può comunque
// contenere markup residuo (es. "<br>", "<p></p>") lasciato dal
// contentEditable. Si spoglia via regex (niente DOM lato server) solo per
// decidere se c'è testo vero, non per l'email (lì l'HTML va mandato intero).
function haTestoVero(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim().length > 0;
}

function spostaGiorno(data: string, giorni: number): string {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + giorni);
  return d.toISOString().slice(0, 10);
}

// Cron mattutino (vercel.json, 7:00 UTC ≈ 9:00 in Italia — Vercel Cron non
// supporta timezone, quindi con l'ora legale l'orario reale scala di 1h,
// stesso limite già accettato per gli altri cron di questo progetto).
// Manda una push con il riepilogo di oggi (eventi + cenno alla nota) se c'è
// almeno una delle due cose, e un'email SOLO se esiste una nota non vuota per
// la data odierna; entrambe solo se il promemoria è attivo (interruttore in
// agenda_impostazioni, gestito dalla pagina Agenda).
export async function GET(request: Request) {
  const rifiutata = rifiutaSeNonCron(request);
  if (rifiutata) return rifiutata;

  const impostazioni = await getImpostazioniAgenda();
  if (impostazioni && !impostazioni.promemoria_note_attivo) {
    return NextResponse.json({ ok: true, inviata: false, motivo: "promemoria disattivato" });
  }

  const data = oggiItaliaISO();
  const nota = await getNotaGiorno(data);
  const haNota = !!nota && haTestoVero(nota.contenuto);

  // Push: il testo non finisce nei log. Un errore qui non blocca l'email.
  let pushInviata = false;
  try {
    // Margine di un giorno per parte: il filtro esatto (fuso Roma) è in componiPushAgenda.
    const eventi = await getEventiRange(spostaGiorno(data, -1), spostaGiorno(data, 2));
    const messaggio = componiPushAgenda(eventi, data, haNota);
    if (messaggio) {
      const esito = await sendPushToOwner({ ...messaggio, url: "/agenda", tag: "agenda-oggi" });
      pushInviata = esito.ok;
    }
  } catch (e) {
    console.error("Agenda note-reminder: push fallita.", (e as Error).message);
  }

  if (!nota || !haNota) {
    return NextResponse.json({ ok: true, inviata: false, push: pushInviata, motivo: "nessuna nota per oggi" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const destinatario = process.env.AGENDA_ALERT_EMAIL;
  if (!apiKey || !destinatario) {
    console.error(
      "Agenda note-reminder: impossibile inviare il promemoria (RESEND_API_KEY o AGENDA_ALERT_EMAIL non impostate)."
    );
    return NextResponse.json({ error: "Configurazione email mancante." }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Radar <onboarding@resend.dev>",
      to: destinatario,
      subject: `Promemoria: nota di oggi (${formatDataLunga(data)})`,
      html: `
        <p>La nota che hai scritto per oggi:</p>
        <div>${nota.contenuto}</div>
        <p><a href="${siteUrl()}/agenda">Apri l'Agenda</a></p>
      `,
    });
  } catch (e) {
    console.error("Agenda note-reminder: invio email fallito.", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inviata: true, push: pushInviata });
}
