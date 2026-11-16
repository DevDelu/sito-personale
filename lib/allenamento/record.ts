import type { SessioneLog, TipoMetrica } from "./types";

type Misura = Pick<SessioneLog, "rip_effettive" | "peso_effettivo" | "tempo_effettivo_sec">;

// Confronto tra due serie dello stesso esercizio: > 0 se `a` batte `b`.
// A tempo conta la durata; con peso conta prima il peso, poi le ripetizioni;
// altrimenti solo le ripetizioni.
export function confrontaSerie(tipo: TipoMetrica, a: Misura, b: Misura): number {
  if (tipo === "tempo") return (a.tempo_effettivo_sec ?? 0) - (b.tempo_effettivo_sec ?? 0);
  if (tipo === "serie_rip_peso") {
    const dPeso = (a.peso_effettivo ?? 0) - (b.peso_effettivo ?? 0);
    if (dPeso !== 0) return dPeso;
  }
  return (a.rip_effettive ?? 0) - (b.rip_effettive ?? 0);
}

// La serie migliore tra quelle già fatte (null se non c'è storico).
export function migliorSerie<T extends Misura>(tipo: TipoMetrica, serie: T[]): T | null {
  let best: T | null = null;
  for (const s of serie) if (!best || confrontaSerie(tipo, s, best) > 0) best = s;
  return best;
}

// Record solo se c'è uno storico con un valore e la nuova serie lo supera
// strettamente (pari non conta; senza storico non c'è confronto).
export function superaRecord(tipo: TipoMetrica, nuova: Misura, massimo: Misura | null): boolean {
  if (!massimo) return false;
  const valore = tipo === "tempo" ? massimo.tempo_effettivo_sec : tipo === "serie_rip_peso" ? (massimo.peso_effettivo ?? massimo.rip_effettive) : massimo.rip_effettive;
  if (valore == null || valore === 0) return false;
  return confrontaSerie(tipo, nuova, massimo) > 0;
}
