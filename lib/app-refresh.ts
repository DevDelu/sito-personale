// Quando l'app (PWA su iPhone) torna in primo piano dopo un po', i dati dei
// Server Component si aggiornano da soli con router.refresh(). Questa è la
// regola pura (testata in app-refresh.test.ts); l'effetto vive in
// components/shell/RefreshAlRitorno.tsx.

export const REFRESH_SOGLIA_MS = 5 * 60 * 1000;

export type ContestoRefresh = {
  ora: number; // Date.now()
  nascostaDal: number | null; // quando la pagina è finita in sfondo
  ultimoRefresh: number | null;
  percorso: string;
  campoConFocus: boolean;
  dialogoAperto: boolean; // Sheet o modale
};

export function dovrebbeRefresh(ctx: ContestoRefresh): boolean {
  if (ctx.nascostaDal === null) return false;
  if (ctx.ora - ctx.nascostaDal < REFRESH_SOGLIA_MS) return false;
  if (ctx.ultimoRefresh !== null && ctx.ora - ctx.ultimoRefresh < REFRESH_SOGLIA_MS) return false;
  if (ctx.percorso.startsWith("/allenamenti/sessione")) return false;
  return !ctx.campoConFocus && !ctx.dialogoAperto;
}
