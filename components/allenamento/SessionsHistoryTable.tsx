"use client";

import { Download } from "lucide-react";
import type { Sessione } from "@/lib/allenamento/types";

const SENSAZIONE_LABEL = ["😞", "🙁", "😐", "🙂", "💪"];

function formatData(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Nessun export CSV preesistente nel modulo Spese da riusare (verificato:
// non c'è in repo), quindi è un'implementazione autonoma — download via
// Blob lato client, pattern standard, nessuna libreria aggiuntiva.
function esportaCsv(sessioni: Sessione[]) {
  const header = ["Data", "Durata (min)", "Sensazione", "Note"];
  const righe = sessioni.map((s) => [
    s.data,
    s.durata_min != null ? String(s.durata_min) : "",
    s.sensazione != null ? String(s.sensazione) : "",
    s.note ?? "",
  ]);

  const csv = [header, ...righe]
    .map((riga) => riga.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `allenamenti-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SessionsHistoryTable({ sessioni }: { sessioni: Sessione[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-medium text-muted">Sessioni</h2>
        <button
          type="button"
          onClick={() => esportaCsv(sessioni)}
          disabled={sessioni.length === 0}
          className="btn-secondary flex items-center gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Esporta CSV
        </button>
      </div>

      {sessioni.length === 0 ? (
        <div className="card flex items-center justify-center p-6">
          <p className="text-sm text-muted">Nessuna sessione registrata ancora.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Durata</th>
                <th className="px-4 py-2 font-medium">Sensazione</th>
                <th className="px-4 py-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {sessioni.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 whitespace-nowrap capitalize">{formatData(s.data)}</td>
                  <td className="font-figures px-4 py-2 whitespace-nowrap">
                    {s.durata_min != null ? `${s.durata_min} min` : "—"}
                  </td>
                  <td className="px-4 py-2">{s.sensazione != null ? SENSAZIONE_LABEL[s.sensazione - 1] : "—"}</td>
                  <td className="max-w-xs truncate px-4 py-2 text-muted">{s.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
