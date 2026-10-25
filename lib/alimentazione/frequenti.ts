import type { Pasto, TipoPasto } from "./types.ts";

export type AlimentoFrequente = {
  alimentoId: string | null;
  nome: string;
  ultimaQuantitaG: number;
  volte: number;
};

const GIORNI_FINESTRA = 30;
const MS_GIORNO = 24 * 60 * 60 * 1000;

// Alimenti più ricorrenti nello stesso tipo di pasto negli ultimi 30 giorni
// (fino a `oggi`, formato YYYY-MM-DD), con l'ultima quantità usata. Ordine:
// numero di volte, poi recenza. Funzione pura: nessun accesso al database.
export function alimentiFrequenti(
  pasti: Pick<Pasto, "data" | "tipo_pasto" | "alimento_id" | "alimento_nome" | "quantita_g" | "created_at">[],
  tipoPasto: TipoPasto,
  oggi: string,
  limite = 6
): AlimentoFrequente[] {
  const fine = Date.parse(`${oggi}T00:00:00Z`);
  if (!Number.isFinite(fine) || limite <= 0) return [];
  const inizio = fine - GIORNI_FINESTRA * MS_GIORNO;

  const gruppi = new Map<string, { item: AlimentoFrequente; ordine: string }>();
  for (const p of pasti) {
    if (p.tipo_pasto !== tipoPasto) continue;
    const t = Date.parse(`${p.data}T00:00:00Z`);
    if (!Number.isFinite(t) || t < inizio || t > fine) continue;
    if (!(p.quantita_g > 0)) continue;

    const chiave = p.alimento_id ?? `nome:${p.alimento_nome.trim().toLowerCase()}`;
    const ordine = `${p.data}|${p.created_at}`;
    const esistente = gruppi.get(chiave);
    if (!esistente) {
      gruppi.set(chiave, {
        item: { alimentoId: p.alimento_id, nome: p.alimento_nome, ultimaQuantitaG: p.quantita_g, volte: 1 },
        ordine,
      });
    } else {
      esistente.item.volte += 1;
      if (ordine > esistente.ordine) {
        esistente.ordine = ordine;
        esistente.item.ultimaQuantitaG = p.quantita_g;
        esistente.item.nome = p.alimento_nome;
      }
    }
  }

  return [...gruppi.values()]
    .sort((a, b) => b.item.volte - a.item.volte || (a.ordine < b.ordine ? 1 : a.ordine > b.ordine ? -1 : 0))
    .slice(0, limite)
    .map((g) => g.item);
}
