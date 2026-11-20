import { rifiutaSeNonOwner } from "@/lib/assistente/accesso";
import { conversa } from "@/lib/assistente/conversa";
import { oggiRoma } from "@/lib/assistente/date";
import { LimiteGroq, trascrivi } from "@/lib/assistente/groq";
import { validaStoria } from "@/lib/assistente/storia";
import type { Contesto } from "@/lib/assistente/strumenti";
import { trascrizioneValida } from "@/lib/assistente/voce";
import { attritoValido, paginaValida } from "@/lib/assistente/pagina";
import { getCategorie } from "@/lib/spese/queries";

// Un turno della conversazione a voce (/assistente): audio registrato dal
// browser (o testo scritto) + storia recente tenuta dal client → risposta.
// La storia vive nel browser: nessuna tabella, sparisce chiudendo la pagina.

export const maxDuration = 60;

function messaggioErrore(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/GROQ_API_KEY/.test(m)) return "Manca la chiave GROQ_API_KEY su Vercel (poi serve un Redeploy).";
  if (/assistente_bozze|assistente_storia|relation .* does not exist/i.test(m)) {
    return "Manca la migration 035 su Supabase (supabase/035_assistente.sql).";
  }
  return m.slice(0, 300) || "Errore sconosciuto.";
}

// Le funzioni Vercel accettano corpi fino a ~4,5 MB; il client chiude la
// registrazione a 60 s, che in Opus/AAC sta ben sotto.
const MAX_AUDIO_BYTES = 4_000_000;

export async function POST(request: Request) {
  const negato = await rifiutaSeNonOwner();
  if (negato) return negato;

  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ error: "Richiesta non valida." }, { status: 400 });

  let storia;
  try {
    storia = validaStoria(JSON.parse(String(form.get("storia") ?? "[]")));
  } catch {
    storia = validaStoria([]);
  }

  try {
    let richiesta = String(form.get("testo") ?? "").trim().slice(0, 2000);
    let trascrizione: string | null = null;
    const audio = form.get("audio");
    if (audio instanceof File && audio.size > 0) {
      if (audio.size > MAX_AUDIO_BYTES) {
        return Response.json({ error: "Audio troppo lungo." }, { status: 413 });
      }
      trascrizione = await trascrivi(audio, audio.name || "voce.webm");
      if (!trascrizioneValida(trascrizione)) {
        return Response.json({ vuoto: true });
      }
      richiesta = trascrizione;
    }
    if (!richiesta) return Response.json({ vuoto: true });

    let attrito;
    try {
      attrito = attritoValido(JSON.parse(String(form.get("attrito") ?? "null")));
    } catch {
      attrito = undefined;
    }
    const ctx: Contesto = {
      oggi: oggiRoma(),
      categorie: await getCategorie(),
      bozze: [],
      bozzeChiuse: [],
      canale: "voce",
      pagina: paginaValida(form.get("pagina")),
      attrito,
    };
    const risposta = await conversa(richiesta, storia, ctx, "voce");
    return Response.json({ trascrizione, richiesta, risposta, bozze: ctx.bozze, bozzeChiuse: ctx.bozzeChiuse });
  } catch (e) {
    if (e instanceof LimiteGroq) {
      return Response.json({ error: "Limite gratuito raggiunto per ora: riprova tra qualche minuto." }, { status: 429 });
    }
    console.error("[assistente] parla", e);
    // Route solo owner: il motivo vero aiuta Lorenzo (e chi lo aiuta) a
    // capire cosa sistemare, invece di un generico "qualcosa è andato storto".
    return Response.json({ error: messaggioErrore(e) }, { status: 500 });
  }
}
