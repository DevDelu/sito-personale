// Logica pura del "tira giù per aggiornare" (components/shell/PullToRefresh.tsx).

export const SOGLIA_PX = 70;
const RESISTENZA = 0.5;
const MAX_PX = 110;

/** Distanza mostrata dall'indicatore: il dito si muove, l'indicatore segue con resistenza. */
export function distanzaVisibile(deltaY: number): number {
  if (!Number.isFinite(deltaY) || deltaY <= 0) return 0;
  return Math.min(MAX_PX, deltaY * RESISTENZA);
}

/** Al rilascio si aggiorna solo se il dito ha percorso la soglia (in px reali del dito). */
export function superaSoglia(deltaY: number): boolean {
  return Number.isFinite(deltaY) && deltaY >= SOGLIA_PX / RESISTENZA;
}

/** Il gesto può partire solo a pagina in cima, su telefono, fuori da sessioni e dialoghi. */
export function gestoAbilitato(o: {
  scrollY: number;
  larghezza: number;
  percorso: string;
  dialogoAperto: boolean;
  campoConFocus: boolean;
}): boolean {
  if (o.scrollY > 0 || o.larghezza >= 768) return false;
  if (o.dialogoAperto || o.campoConFocus) return false;
  if (o.percorso.startsWith("/allenamenti/sessione")) return false;
  return true;
}
