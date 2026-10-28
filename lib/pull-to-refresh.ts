// Tira giù per aggiornare (PWA iPhone, dove il gesto del browser non esiste).
// Regole pure, testate in pull-to-refresh.test.ts; il gesto vive in
// components/shell/PullToRefresh.tsx.

export const PULL_SOGLIA_PX = 70;
export const PULL_MAX_PX = 110;

// Il dito si muove di dy, l'indicatore con un po' di resistenza (come iOS).
export function distanzaTirata(dy: number): number {
  if (dy <= 0) return 0;
  return Math.min(PULL_MAX_PX, dy * 0.5);
}

export function superaSoglia(distanza: number): boolean {
  return distanza >= PULL_SOGLIA_PX;
}

export type ContestoPull = {
  scrollY: number;
  touchMultipli: boolean;
  schermoStretto: boolean; // < 768px
  dialogoAperto: boolean; // Sheet o modale
  percorso: string;
  campoConFocus: boolean;
  bersaglioEscluso: boolean; // grafici, campi, elementi con scroll orizzontale
};

export function puoIniziarePull(ctx: ContestoPull): boolean {
  if (ctx.scrollY > 0 || ctx.touchMultipli || !ctx.schermoStretto) return false;
  if (ctx.dialogoAperto || ctx.campoConFocus || ctx.bersaglioEscluso) return false;
  return !ctx.percorso.startsWith("/allenamenti/sessione");
}
