import { NextResponse } from "next/server";
import { Resend } from "resend";
import { GoogleReauthRequiredError } from "@/lib/agenda/google-client";
import { GoogleNotConnectedError, runGoogleSync } from "@/lib/agenda/sync";

function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

// Notifica via email (stesso provider, Resend, indicato per il form
// contatti) quando il refresh del token Google fallisce: in modalità
// Testing del consent screen il refresh token scade dopo 7 giorni
// (invalid_grant), e senza un avviso attivo la sync notturna si limiterebbe
// a fallire in silenzio finché qualcuno non nota il badge "scaduto" in app.
async function inviaAvvisoRiconnessione(): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const destinatario = process.env.AGENDA_ALERT_EMAIL;
  if (!apiKey || !destinatario) {
    console.error(
      "Agenda cron-sync: refresh token scaduto ma impossibile inviare l'email di avviso (RESEND_API_KEY o AGENDA_ALERT_EMAIL non impostate)."
    );
    return;
  }

  const resend = new Resend(apiKey);
  const reconnectUrl = `${siteUrl()}/agenda`;
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Radar <onboarding@resend.dev>",
    to: destinatario,
    subject: "Radar: riconnessione Google richiesta",
    html: `
      <p>La sincronizzazione notturna dell'Agenda non è riuscita a rinnovare il collegamento con Google: il refresh token è scaduto (modalità Testing del consent screen, scadenza a 7 giorni).</p>
      <p><a href="${reconnectUrl}">Vai alla pagina Agenda per riconnettere Google</a></p>
    `,
  });
}

// Cron notturno (vercel.json, 03:00): rinnova il token Google e risincronizza
// gli eventi da tutti i calendari collegati usando lo stesso motore di
// POST /api/agenda/sync (lib/agenda/sync.ts). Se il refresh fallisce con
// invalid_grant, invia un'email di avviso e logga comunque l'errore.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
    }
  }

  try {
    const result = await runGoogleSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof GoogleReauthRequiredError) {
      console.error("Agenda cron-sync: refresh token Google scaduto (invalid_grant).", e);
      await inviaAvvisoRiconnessione();
      return NextResponse.json({ error: e.message, reauth_required: true }, { status: 401 });
    }
    if (e instanceof GoogleNotConnectedError) {
      // Nessun account Google collegato: niente da fare, non è un errore da
      // notificare ogni notte (l'utente non ha ancora attivato l'integrazione).
      return NextResponse.json({ error: e.message }, { status: 200 });
    }
    console.error("Agenda cron-sync: sync fallita.", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
