import type { Metadata } from "next";
import { getCategorie, getMovimenti } from "@/lib/spese/queries";
import { ExpenseTable } from "@/components/spese/ExpenseTable";
import { GestioneFilters } from "./gestione-filters";
import { Pagination } from "./pagination";

export const metadata: Metadata = { title: "Spese · Gestione" };

const DEFAULT_PAGE_SIZE = 50;
const ALLOWED_PAGE_SIZES = [25, 50, 100, 250, 500];

function parsePageSize(raw: string | undefined): number {
  const n = Number(raw);
  return ALLOWED_PAGE_SIZES.includes(n) ? n : DEFAULT_PAGE_SIZE;
}

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
    pageSize?: string;
  }>;
}) {
  const { search, categoria, tipo, from, to, page, pageSize: pageSizeRaw } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = parsePageSize(pageSizeRaw);

  const [{ rows, total }, categorie] = await Promise.all([
    getMovimenti({
      search,
      categoria,
      tipo: tipo === "spesa" || tipo === "entrata" ? tipo : undefined,
      from,
      to,
      page: currentPage,
      pageSize,
    }),
    getCategorie(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
      <Pagination page={currentPage} totalPages={totalPages} pageSize={pageSize} />
    </div>
  );
}
