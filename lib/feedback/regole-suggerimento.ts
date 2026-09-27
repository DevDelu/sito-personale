// Regole anti-invadenza del suggerimento "Qualcosa non va? Dimmelo" che
// compare dopo un attrito (POTENZIAMENTO 1). Funzioni pure, senza import:
// lo stato vive in localStorage (components/feedback/FeedbackProvider.tsx),
// qui c'è solo la logica, verificata da regole-suggerimento.test.ts.

export const SUGGERIMENTO_DURATA_MS = 4000;
export const IGNORATI_PRIMA_DELLA_PAUSA = 3;
export const PAUSA_GIORNI = 7;

export type StatoSuggerimento = {
  // Giorno locale (YYYY-MM-DD) dell'ultima comparsa: al massimo 1 al giorno.
  ultimoGiorno?: string;
  // Pagina dell'ultima comparsa: mai 2 volte di fila sulla stessa.
  ultimaPagina?: string;
  ignoratiDiFila: number;
  // ISO: fino a quando resta in pausa dopo 3 comparse ignorate di fila.
  pausaFino?: string;
};

export const STATO_SUGGERIMENTO_INIZIALE: StatoSuggerimento = { ignoratiDiFila: 0 };

export type ContestoSuggerimento = {
  pagina: string;
  oggi: string;
  adesso: Date;
  inSessioneAllenamento: boolean;
  campoConFocus: boolean;
  sheetAperto: boolean;
};

export function puoMostrareSuggerimento(stato: StatoSuggerimento, ctx: ContestoSuggerimento): boolean {
  if (ctx.inSessioneAllenamento || ctx.campoConFocus || ctx.sheetAperto) return false;
  if (stato.pausaFino && new Date(stato.pausaFino).getTime() > ctx.adesso.getTime()) return false;
  if (stato.ultimoGiorno === ctx.oggi) return false;
  if (stato.ultimaPagina === ctx.pagina) return false;
  return true;
}

export function dopoMostrato(stato: StatoSuggerimento, pagina: string, oggi: string): StatoSuggerimento {
  return { ...stato, ultimoGiorno: oggi, ultimaPagina: pagina };
}

export function dopoIgnorato(stato: StatoSuggerimento, adesso: Date): StatoSuggerimento {
  const ignorati = stato.ignoratiDiFila + 1;
  if (ignorati < IGNORATI_PRIMA_DELLA_PAUSA) return { ...stato, ignoratiDiFila: ignorati };
  const fine = new Date(adesso.getTime() + PAUSA_GIORNI * 24 * 60 * 60 * 1000);
  return { ...stato, ignoratiDiFila: 0, pausaFino: fine.toISOString() };
}

export function dopoAccettato(stato: StatoSuggerimento): StatoSuggerimento {
  return { ...stato, ignoratiDiFila: 0 };
}

export function inSessioneAllenamento(pathname: string): boolean {
  return pathname.startsWith("/allenamenti/sessione/");
}
