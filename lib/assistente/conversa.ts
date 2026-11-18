import "server-only";
import { completa, type MessaggioChat } from "./groq";
import { DEFINIZIONI, eseguiStrumento, type Contesto } from "./strumenti";
import { giornoSettimana } from "./date";

// Massimo giri LLM ↔ strumenti per messaggio: tiene la risposta sotto il
// timeout della funzione Vercel e i consumi dentro il free tier.
const MAX_GIRI = 5;

function promptDiSistema(ctx: Contesto): string {
  const spese = ctx.categorie.filter((c) => c.tipo === "spesa").map((c) => c.nome);
  const entrate = ctx.categorie.filter((c) => c.tipo === "entrata").map((c) => c.nome);
  return [
    "Sei l'assistente personale di Lorenzo dentro Radar, la sua app privata (spese, investimenti, alimentazione).",
    "Rispondi in italiano, in modo diretto e breve: è una chat su telefono. Niente Markdown, niente tabelle; elenchi semplici con trattini se servono.",
    `Oggi è ${giornoSettimana(ctx.oggi)} ${ctx.oggi} (fuso Europe/Rome). Converti tu le date relative ("ieri", "sabato scorso", "questo mese").`,
    "Quando Lorenzo dice di aver speso o incassato qualcosa, chiama proponi_movimento (una volta per movimento). Non dire che è salvato: comparirà un bottone di conferma.",
    `Categorie spesa: ${spese.join(", ") || "nessuna"}. Categorie entrata: ${entrate.join(", ") || "nessuna"}. Scegli la più adatta tra queste; se nessuna va bene ometti la categoria.`,
    "Per domande sui suoi dati usa SEMPRE gli strumenti: non inventare cifre. Se i dati non bastano dillo.",
    "Puoi dare consigli e analisi (andamento spese, portafoglio, alimentazione), ma non sei un consulente finanziario autorizzato: niente ordini di comprare/vendere, ragiona su dati e rischi.",
    "Se chiede di cambiare o migliorare l'app, o segnala un problema, usa segnala_modifica riportando la richiesta con le sue parole.",
  ].join("\n");
}

export async function conversa(testoUtente: string, ctx: Contesto): Promise<string> {
  const messaggi: MessaggioChat[] = [
    { role: "system", content: promptDiSistema(ctx) },
    { role: "user", content: testoUtente },
  ];

  for (let giro = 0; giro < MAX_GIRI; giro++) {
    const risposta = await completa(messaggi, DEFINIZIONI);
    const chiamate = risposta.tool_calls ?? [];
    if (chiamate.length === 0) return risposta.content?.trim() || "Fatto.";

    messaggi.push({ role: "assistant", content: risposta.content, tool_calls: chiamate });
    for (const c of chiamate) {
      let esito: unknown;
      try {
        esito = await eseguiStrumento(c.function.name, c.function.arguments, ctx);
      } catch (e) {
        console.error("[assistente] strumento", c.function.name, e);
        esito = { errore: "Errore interno nel leggere i dati." };
      }
      messaggi.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(esito) });
    }
  }
  return "Mi sono perso tra troppi passaggi: riprova con una richiesta più semplice.";
}
