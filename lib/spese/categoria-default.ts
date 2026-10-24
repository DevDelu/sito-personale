export const NOME_CATEGORIA_DEFAULT = "Altro";

type CategoriaMinima = { id: string; nome: string; tipo: string };

// Categoria facoltativa all'inserimento: se non è stata scelta si usa "Altro"
// del tipo giusto (spesa/entrata). Restituisce null se non esiste.
export function risolviCategoriaId(
  categoriaId: string,
  categorie: CategoriaMinima[],
  tipo: string
): string | null {
  if (categoriaId) return categoriaId;
  const altro = categorie.find(
    (c) => c.tipo === tipo && c.nome.toLowerCase() === NOME_CATEGORIA_DEFAULT.toLowerCase()
  );
  return altro?.id ?? null;
}
