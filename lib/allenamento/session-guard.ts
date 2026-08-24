// Ponte fuori da React tra la Sidebar (layout privato) e SessionRunner
// (route separata /allenamenti/sessione/[id]): la sidebar non conosce lo
// stato della sessione in corso, quindi SessionRunner registra qui un
// handler mentre è attiva; la sidebar lo interroga ad ogni click su un link
// di navigazione per decidere se intercettare e chiedere conferma.
"use client";

type NavGuardHandler = ((href: string) => void) | null;

let handler: NavGuardHandler = null;

export function setSessionNavGuard(fn: NavGuardHandler) {
  handler = fn;
}

// Ritorna true se un handler ha preso in carico la navigazione (va quindi
// bloccata con preventDefault sul Link chiamante).
export function interceptSessionNav(href: string): boolean {
  if (!handler) return false;
  handler(href);
  return true;
}
