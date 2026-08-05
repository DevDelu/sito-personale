"use client";

import { useRouter, useSearchParams } from "next/navigation";

const ALLOWED_PAGE_SIZES = [25, 50, 100, 250, 500];

export function Pagination({
  page,
  totalPages,
  pageSize,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/spese/gestione?${params.toString()}`);
  }

  function changePageSize(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", value);
    params.set("page", "1");
    router.push(`/spese/gestione?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <label className="flex items-center gap-2">
        Righe per pagina
        <select
          value={pageSize}
          onChange={(e) => changePageSize(e.target.value)}
          className="field-input bg-surface px-2 py-1.5 text-sm"
        >
          {ALLOWED_PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => goTo(page - 1)} disabled={page <= 1} className="btn-secondary">
            ← Precedente
          </button>
          <span className="font-figures">
            Pagina {page} di {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages}
            className="btn-secondary"
          >
            Successiva →
          </button>
        </div>
      )}
    </div>
  );
}
