import "server-only";
import webPush from "web-push";
import { aggiornaUltimoUso, isTabellaMancante, listaSubscriptions, rimuoviSubscription } from "./queries";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export type SendPushResult =
  | { ok: true; sent: number; removed: number; failed: number }
  | {
      ok: false;
      reason: "vapid_non_configurato" | "tabella_mancante" | "nessuna_subscription" | "errore_invio";
    };

// Configurazione VAPID letta e applicata SOLO qui dentro, mai a livello di
// modulo: se le env var mancano (caso normale finché Lorenzo non le imposta
// su Vercel, vedi CLAUDE.md/.env.example) il resto del sito e la build non
// devono rompersi — solo questa funzione degrada restituendo `ok: false`.
function leggiConfigVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || (process.env.AGENDA_ALERT_EMAIL ? `mailto:${process.env.AGENDA_ALERT_EMAIL}` : undefined);

  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}

// Unico punto di invio push del progetto: qualunque funzionalità futura
// (reminder pasti, alert token Google scaduto, digest agenda...) passa da
// qui, non chiama web-push direttamente. Vedi CLAUDE.md.
export async function sendPushToOwner(payload: PushPayload): Promise<SendPushResult> {
  const vapid = leggiConfigVapid();
  if (!vapid) return { ok: false, reason: "vapid_non_configurato" };

  webPush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  let subscriptions;
  try {
    subscriptions = await listaSubscriptions();
  } catch (error) {
    if (isTabellaMancante(error as { code?: string; message?: string })) {
      return { ok: false, reason: "tabella_mancante" };
    }
    return { ok: false, reason: "errore_invio" };
  }

  if (subscriptions.length === 0) return { ok: false, reason: "nessuna_subscription" };

  const body = JSON.stringify(payload);

  let sent = 0;
  let removed = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body);
        sent++;
        // Best-effort: un fallimento qui non deve far apparire l'invio come fallito.
        await aggiornaUltimoUso(sub.endpoint).catch(() => {});
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Endpoint scaduto/revocato: rimuovere subito, non ritentare in
          // futuro (su iOS un push "muto" che non mostra notifica porta
          // comunque alla revoca della subscription da parte del sistema).
          removed++;
          await rimuoviSubscription(sub.endpoint).catch(() => {});
        } else {
          failed++;
        }
      }
    })
  );

  return { ok: true, sent, removed, failed };
}
