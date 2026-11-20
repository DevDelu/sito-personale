// Ponte fuori da React per le conferme brevi ("Modifiche salvate"): chi salva
// chiama mostraToast(), il ToastHost montato nel layout privato lo mostra.
// Stesso pattern di lib/feedback/bus.ts.

export type ToastAzione = { etichetta: string; onClick: () => void };
export type ToastDati = { testo: string; azione?: ToastAzione; durataMs?: number };
export type ToastAttivo = ToastDati & { id: number };

type Ascoltatore = (t: ToastAttivo) => void;

let ascoltatore: Ascoltatore | null = null;
let contatore = 0;

export function registraToast(fn: Ascoltatore | null) {
  ascoltatore = fn;
}

export function mostraToast(dati: ToastDati): boolean {
  const testo = dati.testo.trim();
  if (!testo || !ascoltatore) return false;
  contatore += 1;
  ascoltatore({ ...dati, testo, id: contatore });
  return true;
}

export const DURATA_TOAST_MS = 3500;
