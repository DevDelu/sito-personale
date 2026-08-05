"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function PortfolioDateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  const attivo = Boolean(searchParams.get("from") || searchParams.get("to"));

  function applica() {
    const params = new URLSearchParams(searchParams.toString());
    if (from) params.set("from", from);
    else params.delete("from");
    if (to) params.set("to", to);
    else params.delete("to");
    router.push(`/investimenti?${params.toString()}`);
  }

  function azzera() {
    setFrom("");
    setTo("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    router.push(`/investimenti?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="field-input bg-surface px-2 py-1.5 text-sm"
        aria-label="Dal"
      />
      <span className="text-muted">–</span>
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="field-input bg-surface px-2 py-1.5 text-sm"
        aria-label="Al"
      />
      <button type="button" onClick={applica} className="btn-secondary">
        Applica
      </button>
      {attivo && (
        <button type="button" onClick={azzera} className="btn-secondary">
          Azzera
        </button>
      )}
    </div>
  );
}
