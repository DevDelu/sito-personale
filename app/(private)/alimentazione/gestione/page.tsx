import type { Metadata } from "next";
import { getPasti } from "@/lib/alimentazione/queries";
import type { TipoPasto } from "@/lib/alimentazione/types";
import { PastoTable } from "@/components/alimentazione/PastoTable";
import { GestioneFilters } from "./gestione-filters";
import { Pagination } from "./pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";

const ALIMENTAZIONE_SEGMENTI = SIDEBAR_SECTIONS.find((s) => s.id === "alimentazione")!.subsections!.filter(
  (s) => !s.label.startsWith("+")
);

export const metadata: Metadata = { title: "Alimentazione · Gestione" };

const DEFAULT_PAGE_SIZE = 50;
const ALLOWED_PAGE_SIZES = [25, 50, 100, 250, 500];
const TIPI_VALIDI: TipoPasto[] = ["colazione", "pranzo", "cena", "spuntino"];

function parsePageSize(raw: string | undefined): number {
  const n = Number(raw);
  return ALLOWED_PAGE_SIZES.includes(n) ? n : DEFAULT_PAGE_SIZE;
}

export default async function GestioneAlimentazionePage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string;
    from?: string;
    to?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const { tipo, from, to, page, pageSize: pageSizeRaw } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = parsePageSize(pageSizeRaw);
  const tipoPasto = TIPI_VALIDI.includes(tipo as TipoPasto) ? (tipo as TipoPasto) : undefined;

  const { rows, total } = await getPasti({ tipoPasto, from, to, page: currentPage, pageSize });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Gestione" parent={{ href: "/alimentazione", label: "Alimentazione" }} />
      <SegmentedControl items={ALIMENTAZIONE_SEGMENTI} />

      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Gestione pasti</h1>
        <p className="text-sm text-muted">{total} pasti registrati. Filtra, modifica o elimina.</p>
      </div>

      <GestioneFilters />
      <PastoTable rows={rows} />
      <Pagination page={currentPage} totalPages={totalPages} pageSize={pageSize} />
    </div>
  );
}
