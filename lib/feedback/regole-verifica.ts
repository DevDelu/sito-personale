// Regole anti-invadenza dell'avviso "Avevi segnalato un problema qui. È
// sistemato?" (feedback in `da-verificare`). Funzioni pure, testate in
// regole-verifica.test.ts; lo stato di sessione vive in sessionStorage
// (components/feedback/FeedbackProvider.tsx).

export const VERIFICA_DURATA_MS = 6000;
export const VERIFICA_EVIDENZIA_MS = 2000;
export const VERIFICA_MAX_PER_SESSIONE = 1;

export type ContestoVerifica = {
  mostratiInSessione: number;
  inSessioneAllenamento: boolean;
  campoConFocus: boolean;
  sheetAperto: boolean;
};

export function puoMostrareVerifica(ctx: ContestoVerifica): boolean {
  if (ctx.mostratiInSessione >= VERIFICA_MAX_PER_SESSIONE) return false;
  return !ctx.inSessioneAllenamento && !ctx.campoConFocus && !ctx.sheetAperto;
}

// Il feedback da verificare che riguarda questa pagina (route template): il
// più vecchio, così nessuno resta indietro. Se ignorato riappare alla
// visita successiva della stessa pagina (in una nuova sessione: al massimo
// un avviso per sessione).
export function daVerificareQui<T extends { route: string }>(feedback: T[], route: string): T | null {
  return feedback.find((f) => f.route === route) ?? null;
}
