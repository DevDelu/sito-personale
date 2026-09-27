// Route template della pagina (es. /carte/3f2a...-uuid → /carte/[id]): al
// feedback serve sapere QUALE schermata, non quale record. Gli id nella URL
// sono anche l'unica parte del path che può identificare dati personali.
// Nessun import: condiviso da client, route API e test node:test.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function segmentoDinamico(segmento: string): boolean {
  if (UUID.test(segmento)) return true;
  if (/^\d+$/.test(segmento)) return true;
  // Date (2026-09-27) e token lunghi con cifre (id esterni, slug generati).
  if (/^\d{4}-\d{2}-\d{2}$/.test(segmento)) return true;
  return segmento.length >= 16 && /\d/.test(segmento);
}

export function paginaTemplate(pathname: string): string {
  const pulito = pathname.split(/[?#]/)[0] ?? "";
  const segmenti = pulito
    .split("/")
    .filter(Boolean)
    .map((s) => (segmentoDinamico(s) ? "[id]" : s));
  return `/${segmenti.join("/")}`.slice(0, 200);
}
