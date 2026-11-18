import { HEADER_SEGRETO, datiBottone, leggiBottone, segretoValido, utenteAutorizzato } from "@/lib/telegram/auth";
import { inviaMessaggio, modificaMessaggio, rispondiBottone, scaricaFile, staScrivendo } from "@/lib/telegram/api";
import { trascrivi, LimiteGroq } from "@/lib/assistente/groq";
import { conversa } from "@/lib/assistente/conversa";
import { chiudiBozza, segnaUpdate } from "@/lib/assistente/bozze";
import { leggiStoriaTelegram, salvaScambioTelegram, svuotaStoriaTelegram } from "@/lib/assistente/storia-db";
import { oggiRoma } from "@/lib/assistente/date";
import { getCategorie } from "@/lib/spese/queries";
import type { Contesto } from "@/lib/assistente/strumenti";

// Webhook del bot Telegram privato (vedi CLAUDE.md > "Assistente Telegram").
// In API_AUTONOME del proxy: non c'è sessione Supabase, l'autorizzazione è
// qui: secret del webhook (fail-closed) + id Telegram di Lorenzo.

export const maxDuration = 60;

const DURATA_MAX_VOCALE_S = 300;

type Utente = { id: number };
type Messaggio = {
  message_id: number;
  chat: { id: number };
  from?: Utente;
  text?: string;
  voice?: { file_id: string; duration: number };
  audio?: { file_id: string; duration: number; file_name?: string };
};
type Update = {
  update_id: number;
  message?: Messaggio;
  callback_query?: { id: string; from: Utente; data?: string; message?: { message_id: number; chat: { id: number }; text?: string } };
};

const AIUTO = [
  "Ciao! Scrivimi o mandami un vocale.",
  "",
  "Esempi:",
  "- \"12 euro di spesa al Carrefour\"",
  "- \"ieri pizza 18 euro e cinema 9\"",
  "- \"quanto ho speso in ristoranti questo mese?\"",
  "- \"come va il portafoglio?\"",
  "- \"quante calorie ho mangiato oggi?\"",
  "- \"vorrei il grafico delle spese anche per settimana\" (diventa un feedback per gli agenti)",
  "",
  "Le spese le salvo solo dopo il tuo tap su Conferma (o se mi scrivi \"conferma\").",
  "Ricordo la conversazione per 30 minuti; /nuova per ricominciare da zero.",
].join("\n");

export async function POST(request: Request) {
  if (!segretoValido(request.headers.get(HEADER_SEGRETO), process.env.TELEGRAM_WEBHOOK_SECRET)) {
    return Response.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as Update | null;
  if (!update || typeof update.update_id !== "number") return new Response("ok");

  try {
    if (!(await segnaUpdate(update.update_id))) return new Response("ok");
    if (update.callback_query) await gestisciBottone(update.callback_query);
    else if (update.message) await gestisciMessaggio(update.message);
  } catch (e) {
    console.error("[telegram] update", update.update_id, e);
    const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id;
    const autorizzato = utenteAutorizzato(
      update.message?.from?.id ?? update.callback_query?.from.id,
      process.env.TELEGRAM_OWNER_CHAT_ID
    );
    if (chatId && autorizzato) {
      const testo =
        e instanceof LimiteGroq
          ? "Ho raggiunto il limite gratuito di Groq per ora: riprova tra qualche minuto."
          : "Qualcosa è andato storto. Riprova tra poco.";
      await inviaMessaggio(chatId, testo).catch(() => undefined);
    }
  }
  // Sempre 200: un errore farebbe ripetere l'update a Telegram all'infinito.
  return new Response("ok");
}

async function gestisciMessaggio(msg: Messaggio) {
  const chatId = msg.chat.id;
  const owner = process.env.TELEGRAM_OWNER_CHAT_ID;

  // Primo avvio: senza owner configurato il bot dice solo l'id di chi scrive,
  // per poterlo copiare in TELEGRAM_OWNER_CHAT_ID. Nessun dato esposto.
  if (!owner) {
    await inviaMessaggio(chatId, `Il tuo ID Telegram è ${msg.from?.id}. Mettilo in TELEGRAM_OWNER_CHAT_ID su Vercel e rifai il deploy.`);
    return;
  }
  if (!utenteAutorizzato(msg.from?.id, owner)) return; // estranei: silenzio

  if (msg.text?.startsWith("/start") || msg.text?.startsWith("/aiuto")) {
    await inviaMessaggio(chatId, AIUTO);
    return;
  }

  if (msg.text?.startsWith("/nuova")) {
    await svuotaStoriaTelegram();
    await inviaMessaggio(chatId, "Ok, ricominciamo da zero.");
    return;
  }

  await staScrivendo(chatId);
  let richiesta = msg.text?.trim() ?? "";
  const audio = msg.voice ?? msg.audio;
  if (audio) {
    if (audio.duration > DURATA_MAX_VOCALE_S) {
      await inviaMessaggio(chatId, "Vocale troppo lungo: tienilo sotto i 5 minuti.");
      return;
    }
    const file = await scaricaFile(audio.file_id);
    richiesta = await trascrivi(file, msg.audio?.file_name ?? "vocale.ogg");
    if (!richiesta) {
      await inviaMessaggio(chatId, "Non ho capito il vocale, puoi ripetere?");
      return;
    }
    await inviaMessaggio(chatId, `🎙️ «${richiesta}»`);
  }
  if (!richiesta) {
    await inviaMessaggio(chatId, "Per ora capisco testo e vocali. /aiuto per gli esempi.");
    return;
  }

  const [categorie, storia] = await Promise.all([getCategorie(), leggiStoriaTelegram()]);
  const ctx: Contesto = { oggi: oggiRoma(), categorie, bozze: [], bozzeChiuse: [] };
  const risposta = await conversa(richiesta, storia, ctx, "telegram");
  await inviaMessaggio(chatId, risposta);
  await salvaScambioTelegram(richiesta, risposta).catch((e) => console.error("[telegram] storia", e));
  for (const b of ctx.bozze) {
    await inviaMessaggio(chatId, b.riepilogo, [
      [
        { text: "✅ Conferma", callback_data: datiBottone("conferma", b.id) },
        { text: "❌ Annulla", callback_data: datiBottone("annulla", b.id) },
      ],
    ]);
  }
}

async function gestisciBottone(cb: NonNullable<Update["callback_query"]>) {
  if (!utenteAutorizzato(cb.from.id, process.env.TELEGRAM_OWNER_CHAT_ID)) {
    await rispondiBottone(cb.id);
    return;
  }
  const azione = leggiBottone(cb.data);
  if (!azione) {
    await rispondiBottone(cb.id, "Bottone non valido.");
    return;
  }
  const esito = await chiudiBozza(azione.bozzaId, azione.azione);
  if (!esito.ok) {
    await rispondiBottone(cb.id, "Già gestita.");
    return;
  }
  await rispondiBottone(cb.id, esito.stato === "confermata" ? "Salvata" : "Annullata");
  if (cb.message) {
    const esitoTesto = esito.stato === "confermata" ? "✅ Salvata in Radar" : "❌ Annullata";
    await modificaMessaggio(cb.message.chat.id, cb.message.message_id, `${cb.message.text ?? esito.titolo}\n\n${esitoTesto}`);
  }
}
