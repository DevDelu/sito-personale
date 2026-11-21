import { oggiItaliaISO } from "../cron/data-italia.ts";

// Sorgenti che NON sono un import: spese scritte a mano o dall'assistente.
export const FONTI_NON_IMPORT = ["manuale", "assistente"] as const;

// Da quanti giorni senza caricare la riga in Spese diventa ambra.
export const SOGLIA_AVVISO_GIORNI = 10;
// Entro quanti giorni dall'ultimo caricamento il promemoria della domenica
// non serve.
export const SOGLIA_PROMEMORIA_GIORNI = 3;

// Giorni di calendario (fuso Europe/Rome) tra l'inserimento e adesso.
export function giorniDalCaricamento(createdAt: string, adesso: Date = new Date()): number {
  const da = new Date(`${oggiItaliaISO(new Date(createdAt))}T00:00:00Z`).getTime();
  const a = new Date(`${oggiItaliaISO(adesso)}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((a - da) / 86_400_000));
}

export function etichettaUltimoCaricamento(giorni: number): string {
  if (giorni <= 0) return "Ultimo caricamento: oggi";
  if (giorni === 1) return "Ultimo caricamento: ieri";
  return `Ultimo caricamento: ${giorni} giorni fa`;
}

export function caricamentoInRitardo(giorni: number): boolean {
  return giorni >= SOGLIA_AVVISO_GIORNI;
}

// Il promemoria della domenica parte se non c'è nessun import o se l'ultimo è
// più vecchio della soglia.
export function serveIlPromemoria(createdAt: string | null, adesso: Date = new Date()): boolean {
  if (!createdAt) return true;
  return giorniDalCaricamento(createdAt, adesso) > SOGLIA_PROMEMORIA_GIORNI;
}
