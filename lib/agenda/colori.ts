import type { CategoriaEvento } from "./types";

export const CATEGORIA_COLORE: Record<CategoriaEvento, string> = {
  ferie: "var(--agenda-ferie)",
  visita: "var(--agenda-visita)",
  scadenza: "var(--agenda-scadenza)",
  personale: "var(--agenda-personale)",
  altro: "var(--muted)",
};

// Un evento può avere un colore proprio (override stile Google Calendar) o
// ereditare quello della categoria — stesso fallback usato sia nel
// calendario che nelle liste evento (DayPanel).
export function coloreEvento(evento: { colore: string | null; categoria: CategoriaEvento }): string {
  return evento.colore || CATEGORIA_COLORE[evento.categoria] || "var(--accent)";
}

// Palette fissa (stile Google Calendar) proposta nel form evento: valori
// hex diretti, non legati al tema chiaro/scuro — una scelta di colore
// esplicita dell'utente deve restare quel colore in entrambi i temi.
export const PALETTE_COLORI_EVENTO: { nome: string; valore: string }[] = [
  { nome: "Pomodoro", valore: "#d64545" },
  { nome: "Mandarino", valore: "#e8792e" },
  { nome: "Banana", valore: "#e4c441" },
  { nome: "Salvia", valore: "#4a9b6e" },
  { nome: "Pavone", valore: "#2f9e9e" },
  { nome: "Mirtillo", valore: "#3b6e91" },
  { nome: "Lavanda", valore: "#7c7fd6" },
  { nome: "Uva", valore: "#8b5cb8" },
  { nome: "Fenicottero", valore: "#d6699e" },
  { nome: "Grafite", valore: "#626b81" },
];
