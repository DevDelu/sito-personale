import "server-only";

// Groq (free tier, nessuna carta, non addestra sui dati inviati): Whisper per
// la trascrizione dei vocali e un LLM con function calling per capire la
// richiesta. API compatibile OpenAI, quindi niente SDK: basta fetch.
// Il modello è configurabile da env perché il catalogo Groq cambia nel tempo.

const BASE = "https://api.groq.com/openai/v1";
// llama-3.3-70b-versatile (il default della prima versione) è nella lista
// delle deprecazioni di Groq: in produzione l'assistente rispondeva sempre
// "Qualcosa è andato storto". gpt-oss-120b è tra i modelli di produzione e
// supporta gli strumenti.
const MODELLO_CHAT_DEFAULT = "openai/gpt-oss-120b";
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
  if (res.status === 429) throw new LimiteGroq();
  if (!res.ok) throw new ErroreGroq("trascrizione", res.status, await res.text());
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
  const modello = process.env.GROQ_MODELLO_CHAT || MODELLO_CHAT_DEFAULT;
  const ragionatore = modello.startsWith("openai/gpt-oss");
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${chiave()}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: modello,
      messages: messaggi,
      tools: strumenti,
      tool_choice: "auto",
      temperature: 0.2,
      // gpt-oss ragiona prima di rispondere: "low" tiene bassa la latenza
      // (conta nella conversazione a voce) e il ragionamento non serve al client.
      ...(ragionatore ? { reasoning_effort: "low", include_reasoning: false } : {}),
    }),
  });
  if (res.status === 429) throw new LimiteGroq();
  if (!res.ok) throw new ErroreGroq("chat", res.status, await res.text());
  const json = (await res.json()) as {
    choices: { message: { content: string | null; tool_calls?: ChiamataStrumento[] } }[];
  };
  return json.choices[0]?.message ?? { content: null };
}

// Errore di Groq con un messaggio leggibile per Lorenzo (la pagina e il bot
// sono solo suoi): dice cosa non va invece di "Qualcosa è andato storto".
export class ErroreGroq extends Error {
  constructor(fase: "chat" | "trascrizione", status: number, corpo: string) {
    let dettaglio = "";
    try {
      dettaglio = (JSON.parse(corpo) as { error?: { message?: string } }).error?.message ?? "";
    } catch {
      dettaglio = corpo.slice(0, 200);
    }
    const cosa = fase === "chat" ? "il modello" : "la trascrizione";
    const motivo =
      status === 401
        ? "la chiave GROQ_API_KEY non è valida"
        : status === 404 || /decommission|deprecat|does not exist|not found/i.test(dettaglio)
          ? "il modello non esiste più: cambia GROQ_MODELLO_CHAT/GROQ_MODELLO_VOCE"
          : `errore ${status}`;
    super(`Groq: ${cosa} non risponde (${motivo})${dettaglio ? ` — ${dettaglio.slice(0, 160)}` : ""}`);
  }
}

export class LimiteGroq extends Error {
  constructor() {
    super("Limite del piano gratuito Groq raggiunto");
  }
}
