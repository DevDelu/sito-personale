import { risolviCategoriaId } from "../spese/categoria-default.ts";

type Categoria = { id: string; nome: string; tipo: string };

function normalizza(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
}

// La categoria detta dall'LLM deve esistere davvero (stesso tipo): niente
// categorie create al volo da Telegram. Se non combacia si usa "Altro",
// come nell'inserimento manuale, e Lorenzo la corregge prima di confermare.
export function categoriaPerNome(
  nome: string | undefined,
  categorie: Categoria[],
  tipo: "spesa" | "entrata"
): { id: string | null; nome: string; riconosciuta: boolean } {
  const delTipo = categorie.filter((c) => c.tipo === tipo);
  if (nome) {
    const trovata = delTipo.find((c) => normalizza(c.nome) === normalizza(nome));
    if (trovata) return { id: trovata.id, nome: trovata.nome, riconosciuta: true };
  }
  const id = risolviCategoriaId("", categorie, tipo);
  const altro = delTipo.find((c) => c.id === id);
  return { id, nome: altro?.nome ?? "Altro", riconosciuta: false };
}
