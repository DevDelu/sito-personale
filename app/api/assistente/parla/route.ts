import { rifiutaSeNonOwner } from "@/lib/assistente/accesso";
import { conversa } from "@/lib/assistente/conversa";
import { oggiRoma } from "@/lib/assistente/date";
import { LimiteGroq, trascrivi } from "@/lib/assistente/groq";
import { validaStoria } from "@/lib/assistente/storia";
import type { Contesto } from "@/lib/assistente/strumenti";
import { trascrizioneValida } from "@/lib/assistente/voce";
import { getCategorie } from "@/lib/spese/queries";

// Un turno della conversazione a voce (/assistente): audio registrato dal
// browser (o testo scritto) + storia recente tenuta dal client → risposta.
// La storia vive nel browser: nessuna tabella, sparisce chiudendo la pagina.

export const maxDuration = 60;

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

    const ctx: Contesto = { oggi: oggiRoma(), categorie: await getCategorie(), bozze: [], bozzeChiuse: [] };
    const risposta = await conversa(richiesta, storia, ctx, "voce");
    return Response.json({ trascrizione, richiesta, risposta, bozze: ctx.bozze, bozzeChiuse: ctx.bozzeChiuse });
  } catch (e) {
    if (e instanceof LimiteGroq) {
      return Response.json({ error: "Limite gratuito raggiunto per ora: riprova tra qualche minuto." }, { status: 429 });
    }
    console.error("[assistente] parla", e);
    return Response.json({ error: "Qualcosa è andato storto." }, { status: 500 });
  }
}
