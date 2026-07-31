// Palette per categorie create dinamicamente dall'utente (vedi Modifica 1 /
// app/globals.css). Le categorie "fisse" hanno un colore dedicato assegnato
// via migration SQL (vedi supabase/005_gestione_movimenti.sql); questa
// palette copre invece le categorie aggiunte a runtime dal modal.
const CATEGORY_PALETTE = [
  "--cat-extra-1",
  "--cat-extra-2",
  "--cat-extra-3",
  "--cat-extra-4",
  "--cat-extra-5",
  "--cat-extra-6",
] as const;

// Sceglie il primo colore della palette non ancora usato da nessuna
// categoria esistente; se sono tutti usati, ricicla in round-robin in base
// a quante categorie sono già state create con questa palette.
export function pickCategoryColor(usedColors: Iterable<string | null>): string {
  const used = new Set(usedColors);
  const free = CATEGORY_PALETTE.find((v) => !used.has(`var(${v})`));
  if (free) return `var(${free})`;

  const usedExtraCount = [...used].filter((c) =>
    CATEGORY_PALETTE.some((v) => c === `var(${v})`)
  ).length;
  return `var(${CATEGORY_PALETTE[usedExtraCount % CATEGORY_PALETTE.length]})`;
}
