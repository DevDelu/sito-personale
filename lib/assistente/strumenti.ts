import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTotaliPeriodo } from "@/lib/spese/queries";
import { getPosizioniCorrenti } from "@/lib/investimenti/queries";
import { getPastiByData, getRiepilogoTdee } from "@/lib/alimentazione/queries";
import { inserisciFeedback } from "@/lib/feedback/queries";
import { FEEDBACK_TIPI, type FeedbackTipo } from "@/lib/feedback/types";
import { categoriaPerNome } from "./categorie";
import { dataValida, formattaEuro } from "./date";
import type { DefinizioneStrumento } from "./groq";

// Strumenti che l'LLM può chiamare. Regola: le letture vanno dirette su
// Supabase riusando le query dei moduli; l'unica scrittura sui dati
// (proponi_movimento) crea solo una BOZZA, confermata poi da Lorenzo col
// bottone. L'LLM non tocca mai spese/depositi direttamente.

export type Categoria = { id: string; nome: string; tipo: string };

export type Contesto = {
  oggi: string;
  categorie: Categoria[];
  bozze: { id: string; riepilogo: string }[];
};

type Args = Record<string, unknown>;

const testo = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const DEFINIZIONI: DefinizioneStrumento[] = [
  {
    type: "function",
    function: {
      name: "proponi_movimento",
      description:
        "Prepara una spesa o un'entrata da registrare. Non la salva: Lorenzo la conferma con un bottone. Chiamala una volta per ogni movimento citato.",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["spesa", "entrata"] },
          titolo: { type: "string", description: "Esercente o descrizione breve, es. 'Carrefour', 'Pizza con amici'" },
          importo: { type: "number", description: "Importo in euro, positivo" },
          data: { type: "string", description: "YYYY-MM-DD. Ometti se è oggi" },
          categoria: { type: "string", description: "Una delle categorie esistenti del tipo giusto" },
          descrizione: { type: "string" },
        },
        required: ["tipo", "titolo", "importo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "riepilogo_movimenti",
      description: "Totali di entrate e uscite in un periodo, con le uscite divise per categoria.",
      parameters: {
        type: "object",
        properties: { da: { type: "string", description: "YYYY-MM-DD" }, a: { type: "string", description: "YYYY-MM-DD" } },
        required: ["da", "a"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cerca_movimenti",
      description: "Elenco dei movimenti più recenti, filtrabili per periodo, testo, categoria e tipo.",
      parameters: {
        type: "object",
        properties: {
          da: { type: "string" },
          a: { type: "string" },
          testo: { type: "string", description: "Cerca nel titolo e nella descrizione" },
          categoria: { type: "string" },
          tipo: { type: "string", enum: ["spesa", "entrata"] },
          limite: { type: "number", description: "Massimo 30, default 10" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "portafoglio_investimenti",
      description: "Posizioni aperte con valore attuale, costo di carico e plusvalenza.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "alimentazione_giorno",
      description: "Pasti registrati in un giorno con kcal e macro, confrontati col target kcal.",
      parameters: { type: "object", properties: { data: { type: "string", description: "YYYY-MM-DD, default oggi" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "segnala_modifica",
      description:
        "Registra un problema, una cosa complicata o un'idea di miglioramento per l'app Radar. Finisce nel ciclo dei feedback lavorato dagli agenti.",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: [...FEEDBACK_TIPI] },
          testo: { type: "string", description: "La richiesta completa, con le parole di Lorenzo" },
          pagina: { type: "string", description: "Route interessata se chiara, es. /spese, /alimentazione" },
        },
        required: ["tipo", "testo"],
      },
    },
  },
];

async function proponiMovimento(args: Args, ctx: Contesto) {
  const tipo = args.tipo === "entrata" ? "entrata" : "spesa";
  const titolo = testo(args.titolo);
  const importo = Math.round(Number(args.importo) * 100) / 100;
  if (!titolo) return { errore: "Manca il titolo." };
  if (!Number.isFinite(importo) || importo <= 0) return { errore: "Importo non valido." };
  const data = args.data === undefined || args.data === "" ? ctx.oggi : args.data;
  if (!dataValida(data, ctx.oggi)) return { errore: `Data non valida: ${String(args.data)}` };

  const categoria = categoriaPerNome(testo(args.categoria) || undefined, ctx.categorie, tipo);
  const admin = createAdminClient();
  const { data: riga, error } = await admin
    .from("telegram_bozze")
    .insert({
      tipo,
      titolo,
      importo,
      data,
      categoria_id: categoria.id,
      descrizione: testo(args.descrizione, 500) || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const riepilogo =
    `${tipo === "spesa" ? "💸 Spesa" : "💰 Entrata"}: ${titolo} — ${formattaEuro(importo)}\n` +
    `📅 ${data}  🏷️ ${categoria.nome}${categoria.riconosciuta ? "" : " (categoria da verificare)"}`;
  ctx.bozze.push({ id: riga.id, riepilogo });
  return { bozza_creata: true, riepilogo, nota: "Lorenzo vedrà i bottoni Conferma/Annulla: non chiedere altra conferma." };
}

async function riepilogoMovimenti(args: Args, ctx: Contesto) {
  const da = testo(args.da);
  const a = testo(args.a);
  if (!dataValida(da, ctx.oggi) || !/^\d{4}-\d{2}-\d{2}$/.test(a)) return { errore: "Periodo non valido." };

  const admin = createAdminClient();
  const perCategoria = new Map<string, number>();
  const PAGINA = 1000;
  for (let off = 0; ; off += PAGINA) {
    const { data, error } = await admin
      .from("movimenti_con_categoria")
      .select("importo, categoria_nome")
      .eq("tipo", "spesa")
      .gte("data", da)
      .lte("data", a)
      .order("id")
      .range(off, off + PAGINA - 1);
    if (error) throw new Error(error.message);
    for (const r of data ?? []) {
      const k = r.categoria_nome ?? "Senza categoria";
      perCategoria.set(k, (perCategoria.get(k) ?? 0) + Number(r.importo));
    }
    if (!data || data.length < PAGINA) break;
  }
  const { entrate, uscite } = await getTotaliPeriodo(da, a);
  return {
    periodo: { da, a },
    entrate: Math.round(entrate * 100) / 100,
    uscite: Math.round(uscite * 100) / 100,
    saldo: Math.round((entrate - uscite) * 100) / 100,
    uscite_per_categoria: [...perCategoria.entries()]
      .sort((x, y) => y[1] - x[1])
      .map(([categoria, totale]) => ({ categoria, totale: Math.round(totale * 100) / 100 })),
  };
}

async function cercaMovimenti(args: Args) {
  const limite = Math.min(Math.max(Number(args.limite) || 10, 1), 30);
  const admin = createAdminClient();
  let q = admin
    .from("movimenti_con_categoria")
    .select("tipo, data, titolo, importo, categoria_nome, descrizione")
    .order("data", { ascending: false })
    .limit(limite);
  const t = testo(args.testo, 60).replace(/[%,()]/g, "");
  if (t) q = q.or(`titolo.ilike.%${t}%,descrizione.ilike.%${t}%`);
  if (testo(args.categoria)) q = q.ilike("categoria_nome", testo(args.categoria));
  if (args.tipo === "spesa" || args.tipo === "entrata") q = q.eq("tipo", args.tipo);
  if (/^\d{4}-\d{2}-\d{2}$/.test(testo(args.da))) q = q.gte("data", testo(args.da));
  if (/^\d{4}-\d{2}-\d{2}$/.test(testo(args.a))) q = q.lte("data", testo(args.a));
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return { movimenti: (data ?? []).map((r) => ({ ...r, importo: Number(r.importo) })) };
}

async function portafoglio() {
  const posizioni = await getPosizioniCorrenti();
  const r2 = (n: number | null) => (n === null ? null : Math.round(n * 100) / 100);
  return {
    posizioni: posizioni.map((p) => ({
      nome: p.asset.nome,
      quantita: p.quantitaValore,
      prezzo_attuale: r2(p.prezzoAttuale),
      prezzo_del: p.prezzoAttualeData,
      valore: r2(p.valoreAttuale),
      costo_carico: r2(p.costoTotaleCarico),
      plusvalenza: r2(p.plusvalenzaAssoluta),
      plusvalenza_pct: r2(p.plusvalenzaPercentuale),
      dati_incompleti: p.datiIncompleti || p.hasStimato || p.hasSconosciuto,
    })),
    valore_totale: r2(posizioni.reduce((s, p) => s + (p.valoreAttuale ?? 0), 0)),
  };
}

async function alimentazioneGiorno(args: Args, ctx: Contesto) {
  const data = dataValida(args.data, ctx.oggi) ? (args.data as string) : ctx.oggi;
  const [pasti, tdee] = await Promise.all([getPastiByData(data), getRiepilogoTdee()]);
  const somma = (k: "kcal" | "proteine_g" | "carboidrati_g" | "grassi_g") =>
    Math.round(pasti.reduce((s, p) => s + Number(p[k]), 0));
  return {
    data,
    pasti: pasti.map((p) => ({ tipo: p.tipo_pasto, alimento: p.alimento_nome, grammi: p.quantita_g, kcal: Math.round(p.kcal) })),
    totali: { kcal: somma("kcal"), proteine_g: somma("proteine_g"), carboidrati_g: somma("carboidrati_g"), grassi_g: somma("grassi_g") },
    target_kcal: tdee.ok ? Math.round(tdee.targetKcal) : null,
  };
}

async function segnalaModifica(args: Args) {
  const tipo = (FEEDBACK_TIPI as readonly string[]).includes(String(args.tipo)) ? (args.tipo as FeedbackTipo) : "idea";
  const corpo = testo(args.testo, 5000);
  if (!corpo) return { errore: "Testo vuoto." };
  const pagina = testo(args.pagina, 100);
  const esito = await inserisciFeedback({
    route: pagina.startsWith("/") ? pagina : "/telegram",
    url: null,
    area: null,
    entita: null,
    punto: null,
    tipo,
    testo: corpo,
    origine: "telegram",
    // Metadati tecnici obbligatori nel tipo: qui non c'è una pagina aperta,
    // il bot si usa da telefono.
    contesto: { query_chiavi: [], viewport: "mobile", tema: "scuro" },
  });
  return esito.ok ? { registrato: true } : { errore: esito.motivo };
}

export async function eseguiStrumento(nome: string, argomenti: string, ctx: Contesto): Promise<unknown> {
  let args: Args;
  try {
    args = argomenti ? (JSON.parse(argomenti) as Args) : {};
  } catch {
    return { errore: "Argomenti non validi (JSON)." };
  }
  switch (nome) {
    case "proponi_movimento":
      return proponiMovimento(args, ctx);
    case "riepilogo_movimenti":
      return riepilogoMovimenti(args, ctx);
    case "cerca_movimenti":
      return cercaMovimenti(args);
    case "portafoglio_investimenti":
      return portafoglio();
    case "alimentazione_giorno":
      return alimentazioneGiorno(args, ctx);
    case "segnala_modifica":
      return segnalaModifica(args);
    default:
      return { errore: `Strumento sconosciuto: ${nome}` };
  }
}
