import type { TipoCategoria } from "@/lib/types";

// PLACEHOLDER: euristica locale per parole chiave, nessuna chiamata a un
// servizio esterno. Da sostituire con una vera chiamata all'API Anthropic
// (vedi app/api/categorize-suggestion/route.ts) quando sarà disponibile una
// ANTHROPIC_API_KEY: stessa firma, così il resto del codice non cambia.
const KEYWORDS: { pattern: RegExp; categoria: string; tipo: TipoCategoria }[] = [
  { pattern: /superm|esselunga|conad|coop\b|lidl|carrefour|alimentar|market/i, categoria: "Alimentari", tipo: "spesa" },
  { pattern: /benzina|carburant|distributore|\beni\b|\besso\b|\bq8\b|\bip\b/i, categoria: "Benzina", tipo: "spesa" },
  { pattern: /vinted/i, categoria: "Vinted", tipo: "spesa" },
  { pattern: /paypal/i, categoria: "PayPal", tipo: "spesa" },
  { pattern: /bonifico/i, categoria: "Bonifici", tipo: "spesa" },
  { pattern: /ristorant|pizzeria|trattoria|\bbar\b|sushi|osteria/i, categoria: "Ristoranti", tipo: "spesa" },
  { pattern: /stipendio|salary|payroll|retribuzione/i, categoria: "Stipendio", tipo: "entrata" },
  { pattern: /rimbors/i, categoria: "Rimborso", tipo: "entrata" },
  { pattern: /vinted/i, categoria: "Vinted", tipo: "entrata" },
  { pattern: /bonifico/i, categoria: "Bonifici", tipo: "entrata" },
];

export function suggestCategoria(testo: string, tipo: TipoCategoria): string | null {
  if (!testo) return null;
  const match = KEYWORDS.find((k) => k.tipo === tipo && k.pattern.test(testo));
  return match?.categoria ?? null;
}
