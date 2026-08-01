import { AlertTriangle, HelpCircle } from "lucide-react";
import { formatCurrency, formatPercent, formatQuantita, TIPO_ASSET_LABEL } from "@/lib/investimenti/format";
import type { Posizione } from "@/lib/investimenti/types";

export function PositionsTable({ posizioni }: { posizioni: Posizione[] }) {
  if (posizioni.length === 0) {
    return (
      <div className="card flex items-center justify-center p-8">
        <p className="text-sm text-muted">Nessuna posizione aperta. Aggiungine una da Gestione.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-4 py-3 font-medium">Asset</th>
            <th className="px-4 py-3 font-medium">Quantità</th>
            <th className="px-4 py-3 font-medium">Prezzo medio carico</th>
            <th className="px-4 py-3 font-medium">Prezzo attuale</th>
            <th className="px-4 py-3 font-medium">Valore</th>
            <th className="px-4 py-3 font-medium">Plus/minusvalenza</th>
          </tr>
        </thead>
        <tbody className="font-figures">
          {posizioni.map((p) => {
            const gainColor =
              p.plusvalenzaAssoluta === null ? "var(--muted)" : p.plusvalenzaAssoluta >= 0 ? "var(--entrata)" : "var(--spesa)";
            return (
              <tr key={p.asset.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                <td className="px-4 py-3 font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{p.asset.nome}</span>
                    {p.hasStimato && (
                      <span title="Include costi stimati">
                        <AlertTriangle className="h-3.5 w-3.5 text-accent" />
                      </span>
                    )}
                    {p.hasSconosciuto && (
                      <span title="Include quantità a costo sconosciuto">
                        <HelpCircle className="h-3.5 w-3.5 text-muted" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-sans text-muted">
                    {p.asset.ticker} · {TIPO_ASSET_LABEL[p.asset.tipo] ?? p.asset.tipo}
                  </div>
                </td>
                <td className="px-4 py-3">{formatQuantita(p.quantitaNetta)}</td>
                <td className="px-4 py-3">{p.costoMedioCarico === null ? "n/d" : formatCurrency(p.costoMedioCarico)}</td>
                <td className="px-4 py-3">
                  {p.prezzoAttuale === null ? (
                    <span className="text-xs text-muted">n/d</span>
                  ) : (
                    <div className="flex flex-col">
                      <span>{formatCurrency(p.prezzoAttuale)}</span>
                      <span className="text-xs font-sans text-muted">
                        {p.prezzoAttualeFonte === "prezzi_storico" ? "storico" : "ultima transazione"}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">{p.valoreAttuale === null ? "n/d" : formatCurrency(p.valoreAttuale)}</td>
                <td className="px-4 py-3" style={{ color: gainColor }}>
                  {p.plusvalenzaAssoluta === null
                    ? "n/d"
                    : `${formatCurrency(p.plusvalenzaAssoluta)} (${formatPercent(p.plusvalenzaPercentuale ?? 0)})`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
