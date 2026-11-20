// Memoria breve della conversazione: gli ultimi scambi testuali (niente
// risultati degli strumenti, che si ricalcolano), così "e il mese prima?"
// ha un riferimento. Pura: usata dal webhook Telegram e dalla pagina voce.

export type Turno = { role: "user" | "assistant"; content: string };

export const MAX_TURNI = 10;
const MAX_CARATTERI = 2000;

// Valida la storia arrivata dal client: solo ruoli user/assistant, testi
// limitati, ultimi MAX_TURNI. Qualsiasi altra forma → storia vuota.
export function validaStoria(grezza: unknown): Turno[] {
  if (!Array.isArray(grezza)) return [];
  const turni: Turno[] = [];
  for (const t of grezza) {
    if (!t || typeof t !== "object") return [];
    const { role, content } = t as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return [];
    const testo = content.trim().slice(0, MAX_CARATTERI);
    if (testo) turni.push({ role, content: testo });
  }
  return turni.slice(-MAX_TURNI);
}
