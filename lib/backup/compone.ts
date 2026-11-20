// Composizione pura del backup: quali tabelle entrano, quali no, e la forma del file.
// Nessun accesso al database qui (così si testa senza Supabase).

export const TABELLE_BACKUP = [
  "spese",
  "categorie",
  "depositi",
  "transazioni",
  "assets",
  "portfolio_snapshot",
  "manual_price_snapshots",
  "my_collection",
  "prezzi_storico",
  "eventi",
  "note_giorno",
  "impegni_fissi",
  "agenda_impostazioni",
  "pasti",
  "alimenti",
  "template_pasti",
  "peso_corporeo",
  "profilo_nutrizionale",
  "esercizi",
  "schede",
  "scheda_esercizi",
  "sessioni",
  "sessioni_log",
] as const;

// Mai nel backup: credenziali e dati di altri utenti.
export const TABELLE_ESCLUSE = [
  "integrazione_google",
  "push_subscriptions",
  "profiles",
  "quiz_attempts",
  "quiz_questions",
] as const;

export type RigheTabella = { tabella: string; righe: unknown[] | null; errore?: string };

export type Backup = {
  versione: 1;
  generato_il: string;
  tabelle: Record<string, unknown[]>;
  non_disponibili: Record<string, string>;
};

export function componiBackup(risultati: RigheTabella[], adesso: Date): Backup {
  const tabelle: Record<string, unknown[]> = {};
  const non_disponibili: Record<string, string> = {};
  for (const r of risultati) {
    if ((TABELLE_ESCLUSE as readonly string[]).includes(r.tabella)) continue;
    if (r.errore || !r.righe) non_disponibili[r.tabella] = r.errore ?? "nessun dato";
    else tabelle[r.tabella] = r.righe;
  }
  return { versione: 1, generato_il: adesso.toISOString(), tabelle, non_disponibili };
}

export function nomeFileBackup(adesso: Date): string {
  return `radar-backup-${adesso.toISOString().slice(0, 10)}.json`;
}
