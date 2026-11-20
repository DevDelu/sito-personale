// Calcolo puro del countdown: si ragiona su un orario di fine, non su "meno 1
// a ogni intervallo", perché iOS rallenta o sospende i timer con lo schermo
// bloccato o l'app in secondo piano.

/** Secondi interi rimasti (arrotondati per eccesso) fino a `fineMs`, mai negativi. */
export function secondiRimasti(fineMs: number, oraMs: number): number {
  return Math.max(0, Math.ceil((fineMs - oraMs) / 1000));
}

/** Valori 1..5 "saltati" passando da `prima` a `dopo` secondi: uno beep ciascuno. */
export function beepDaSuonare(prima: number, dopo: number, soglia = 5): number[] {
  const out: number[] = [];
  for (let v = prima - 1; v >= Math.max(dopo, 1); v--) if (v <= soglia) out.push(v);
  return out;
}
