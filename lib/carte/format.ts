export { formatCurrency } from "@/lib/spese-utils";

export function variazionePercentuale(current: number | null, avg30: number | null): number | null {
  if (current === null || avg30 === null || avg30 === 0) return null;
  return ((current - avg30) / avg30) * 100;
}

// "Stabile" copre sia gli scarti minimi sia i valori che arrotondati a
// percentuale intera finirebbero comunque a "0%"/"-0%" (es. -0,12%).
function eStabile(v: number): boolean {
  return Math.round(v) === 0;
}

export function formatVariazione(v: number | null): string {
  if (v === null) return "n/d";
  if (eStabile(v)) return "stabile";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(0)}% vs media 30gg`;
}

export function variazioneColorVar(v: number | null): string {
  if (v === null || eStabile(v)) return "--muted";
  return v > 0 ? "--entrata" : "--spesa";
}

// Hue deterministico dal nome carta, per il placeholder a gradiente finché
// non importiamo gli image_url reali (task manuale futuro).
export function hueFromName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}
