import "server-only";

// Groq (free tier, nessuna carta, non addestra sui dati inviati): Whisper per
// la trascrizione dei vocali e un LLM con function calling per capire la
// richiesta. API compatibile OpenAI, quindi niente SDK: basta fetch.
// Il modello è configurabile da env perché il catalogo Groq cambia nel tempo.

const BASE = "https://api.groq.com/openai/v1";
const MODELLO_CHAT_DEFAULT = "llama-3.3-70b-versatile";
const MODELLO_VOCE_DEFAULT = "whisper-large-v3-turbo";

function chiave(): string {
  const k = process.env.GROQ_API_KEY;
  if (!k) throw new Error("GROQ_API_KEY non configurata");
  return k;
}

export async function trascrivi(audio: Blob, nomeFile = "vocale.ogg"): Promise<string> {
  const form = new FormData();
  form.append("file", audio, nomeFile);
  form.append("model", process.env.GROQ_MODELLO_VOCE || MODELLO_VOCE_DEFAULT);
  form.append("language", "it");
  form.append("response_format", "json");
  const res = await fetch(`${BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { authorization: `Bearer ${chiave()}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Groq trascrizione: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { text?: string };
  return (json.text ?? "").trim();
}

export type MessaggioChat =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ChiamataStrumento[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type ChiamataStrumento = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type DefinizioneStrumento = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

export async function completa(
  messaggi: MessaggioChat[],
  strumenti: DefinizioneStrumento[]
): Promise<{ content: string | null; tool_calls?: ChiamataStrumento[] }> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${chiave()}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.GROQ_MODELLO_CHAT || MODELLO_CHAT_DEFAULT,
      messages: messaggi,
      tools: strumenti,
      tool_choice: "auto",
      temperature: 0.2,
    }),
  });
  if (res.status === 429) throw new LimiteGroq();
  if (!res.ok) throw new Error(`Groq chat: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as {
    choices: { message: { content: string | null; tool_calls?: ChiamataStrumento[] } }[];
  };
  return json.choices[0]?.message ?? { content: null };
}

export class LimiteGroq extends Error {
  constructor() {
    super("Limite del piano gratuito Groq raggiunto");
  }
}
