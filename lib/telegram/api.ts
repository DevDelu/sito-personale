import "server-only";

// Client minimo della Telegram Bot API (gratuita, nessuna libreria): solo i
// metodi che servono all'assistente. Il token resta lato server.

function token(): string {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error("TELEGRAM_BOT_TOKEN non configurato");
  return t;
}

async function chiama<T>(metodo: string, corpo: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token()}/${metodo}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!json.ok) throw new Error(`Telegram ${metodo}: ${json.description ?? res.status}`);
  return json.result as T;
}

export type Bottone = { text: string; callback_data: string };

// Testo semplice (nessun parse_mode): le risposte dell'LLM possono contenere
// caratteri che rompono Markdown/HTML di Telegram e farebbero fallire l'invio.
export function inviaMessaggio(chatId: number, testo: string, bottoni?: Bottone[][]) {
  return chiama("sendMessage", {
    chat_id: chatId,
    text: testo.slice(0, 4096),
    ...(bottoni ? { reply_markup: { inline_keyboard: bottoni } } : {}),
  });
}

export function modificaMessaggio(chatId: number, messageId: number, testo: string) {
  return chiama("editMessageText", { chat_id: chatId, message_id: messageId, text: testo.slice(0, 4096) });
}

export function rispondiBottone(callbackQueryId: string, testo?: string) {
  return chiama("answerCallbackQuery", { callback_query_id: callbackQueryId, ...(testo ? { text: testo } : {}) });
}

export function staScrivendo(chatId: number) {
  return chiama("sendChatAction", { chat_id: chatId, action: "typing" }).catch(() => undefined);
}

// Scarica un file (vocale) dai server Telegram. I bot possono scaricare file
// fino a 20 MB: un vocale di qualche minuto è ampiamente sotto.
export async function scaricaFile(fileId: string): Promise<Blob> {
  const { file_path } = await chiama<{ file_path?: string }>("getFile", { file_id: fileId });
  if (!file_path) throw new Error("Telegram getFile: file_path mancante");
  const res = await fetch(`https://api.telegram.org/file/bot${token()}/${file_path}`);
  if (!res.ok) throw new Error(`Download vocale: ${res.status}`);
  return res.blob();
}
