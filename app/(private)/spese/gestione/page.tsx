import type { Metadata } from "next";
import { getCategorie, getMovimenti } from "@/lib/spese/queries";
import { ExpenseTable } from "@/components/spese/ExpenseTable";
import { GestioneFilters } from "./gestione-filters";
import { Pagination } from "./pagination";

export const metadata: Metadata = { title: "Spese · Gestione" };

const PAGE_SIZE = 50;

export default async function GestionePage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    categoria?: string;
    tipo?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const { search, categoria, tipo, from, to, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const [{ rows, total }, categorie] = await Promise.all([
    getMovimenti({
      search,
      categoria,
      tipo: tipo === "spesa" || tipo === "entrata" ? tipo : undefined,
      from,
      to,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    getCategorie(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Gestione movimenti</h1>
        <p className="text-sm text-muted">
          {total} movimenti totali. Cerca, filtra, modifica o elimina.
        </p>
      </div>

      <GestioneFilters categorie={categorie} />
      <ExpenseTable rows={rows} categorie={categorie} />
      <Pagination page={currentPage} totalPages={totalPages} />
    </div>
  );
}
