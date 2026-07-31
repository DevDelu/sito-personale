"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/spese/gestione?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between text-sm text-muted">
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
  );
}
