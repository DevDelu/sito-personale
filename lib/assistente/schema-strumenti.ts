import type { DefinizioneStrumento } from "./groq.ts";

// Groq valida gli argomenti delle chiamate contro lo schema dello strumento e
// risponde 400 se il modello passa `null` per un parametro opzionale di tipo
// stringa ("/pagina: expected string, but got null"). Rendiamo nullabili tutti
// gli opzionali: gli strumenti già trattano null come "assente".
type Proprieta = { type?: unknown; enum?: unknown[] };

export function opzionaliNullabili(defs: DefinizioneStrumento[]): DefinizioneStrumento[] {
  return defs.map((d) => {
    const p = d.function.parameters as { properties?: Record<string, Proprieta>; required?: string[] };
    if (!p.properties) return d;
    const richiesti = new Set(p.required ?? []);
    const properties: Record<string, Proprieta> = {};
    for (const [nome, prop] of Object.entries(p.properties)) {
      if (richiesti.has(nome) || typeof prop.type !== "string") {
        properties[nome] = prop;
        continue;
      }
      properties[nome] = {
        ...prop,
        type: [prop.type, "null"],
        ...(prop.enum ? { enum: [...prop.enum, null] } : {}),
      };
    }
    return { ...d, function: { ...d.function, parameters: { ...p, properties } } };
  });
}
