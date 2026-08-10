import type { ImportRow } from "@/lib/parsers/import-excel";
import type { RawTransaction } from "@/lib/parsers/raw-crypto";
import { REGOLE } from "@/lib/categorization/rules";

export type CategorizedRow = ImportRow & { daVerificare: boolean; categoriaSuggerita: string | null };
export type ExclusedRow = { raw: RawTransaction; motivoRegolaId: string };

// La regola "default-altro" matcha sempre (match: () => true) ed è l'ultima
// dell'elenco, quindi applicaCategorizzazione trova sempre una regola per
// ogni riga: non esiste il caso "nessuna regola matchata".
export function applicaCategorizzazione(righe: RawTransaction[]): {
  categorizzate: CategorizedRow[];
  escluse: ExclusedRow[];
} {
  const categorizzate: CategorizedRow[] = [];
  const escluse: ExclusedRow[] = [];

  for (const raw of righe) {
    const regola = REGOLE.find((r) => r.match(raw));
    if (!regola) continue; // non dovrebbe accadere: default-altro copre tutto

    if (regola.escludi) {
      escluse.push({ raw, motivoRegolaId: regola.id });
      continue;
    }

    const isDefault = regola.id === "default-altro";

    categorizzate.push({
      tipo: raw.tipo,
      data: raw.data,
      importo: raw.importo,
      categoria: regola.categoria!,
      titolo: regola.titolo(raw),
      descrizione: raw.dettagliGrezzi || null,
      nominativo: regola.estraiNominativo?.(raw) ?? null,
      dettaglio: regola.estraiDettaglio?.(raw) ?? (raw.dettagliGrezzi || null),
      fonte: raw.fonte,
      daVerificare: isDefault,
      categoriaSuggerita: isDefault ? raw.categoriaBanca : null,
    });
  }

  return { categorizzate, escluse };
}
