"use client";

import { Fragment, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import {
  formatCurrency,
  formatPercent,
  formatQuantita,
  TIPO_ASSET_COLOR_VAR,
  TIPO_ASSET_LABEL,
} from "@/lib/investimenti/format";
import type { Posizione, TransazioneConAsset } from "@/lib/investimenti/types";

export function PositionsTable({
  posizioni,
  transazioni,
}: {
  posizioni: Posizione[];
  transazioni: TransazioneConAsset[];
}) {
  const [espansa, setEspansa] = useState<string | null>(null);

  if (posizioni.length === 0) {
    return (
      <div className="card flex items-center justify-center p-8">
        <p className="text-sm text-muted">Nessuna posizione aperta. Aggiungine una da Gestione.</p>
      </div>
    );
  }

  return (
    <>
      <PositionsCards posizioni={posizioni} transazioni={transazioni} />
      <div className="card hidden overflow-x-auto md:block">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-4 py-3 font-medium" />
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
              p.plusvalenzaAssoluta === null
                ? "var(--muted)"
                : p.plusvalenzaAssoluta >= 0
                  ? "var(--entrata)"
                  : "var(--spesa)";
            const tipoColorVar = TIPO_ASSET_COLOR_VAR[p.asset.tipo] ?? "--muted";
            const aperta = espansa === p.asset.id;
            const transazioniAsset = transazioni.filter((t) => t.asset_id === p.asset.id);

            return (
              <Fragment key={p.asset.id}>
                <tr
                  data-fb-entita={`asset:${p.asset.isin ?? p.asset.ticker}`}
                  onClick={() => setEspansa(aperta ? null : p.asset.id)}
                  className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-hover"
                >
                  <td className="px-4 py-3">
                    {aperta ? (
                      <ChevronDown className="h-4 w-4 text-muted" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: `var(${tipoColorVar})` }}
                      />
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
                      {p.datiIncompleti && (
                        <span
                          className="rounded-full border px-1.5 py-0.5 text-[12px] font-sans uppercase tracking-wide"
                          style={{ borderColor: "var(--invest-stock)", color: "var(--invest-stock)" }}
                          title="La quantità reale è nota da un riferimento manuale, ma non tutte le transazioni sono ancora caricate: costo medio e plusvalenza restano parziali."
                        >
                          storico incompleto
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-sans text-muted">
                      {p.asset.ticker} · {TIPO_ASSET_LABEL[p.asset.tipo] ?? p.asset.tipo}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {formatQuantita(p.quantitaValore)}
                    {p.datiIncompleti && (
                      <div className="text-xs font-sans text-muted">
                        da transazioni: {formatQuantita(p.quantitaNetta)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.costoMedioCarico === null ? "n/d" : formatCurrency(p.costoMedioCarico)}
                  </td>
                  <td className="px-4 py-3">
                    {p.prezzoAttuale === null ? (
                      <span className="text-xs text-muted">n/d</span>
                    ) : (
                      <div className="flex flex-col">
                        <span>{formatCurrency(p.prezzoAttuale)}</span>
                        <span className="text-xs font-sans text-muted">
                          {p.prezzoAttualeFonte === "prezzi_storico" ? "mercato" : "ultima transazione"}
                          {p.prezzoAttualeData &&
                            ` · ${new Date(`${p.prezzoAttualeData}T00:00:00`).toLocaleDateString("it-IT", {
                              day: "2-digit",
                              month: "2-digit",
                            })}`}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="importo px-4 py-3">
                    {p.valoreAttuale === null ? "n/d" : formatCurrency(p.valoreAttuale)}
                  </td>
                  <td className="importo px-4 py-3" style={{ color: gainColor }}>
                    {p.plusvalenzaAssoluta === null
                      ? "n/d"
                      : `${formatCurrency(p.plusvalenzaAssoluta)} (${formatPercent(p.plusvalenzaPercentuale ?? 0)})`}
                  </td>
                </tr>
                {aperta && (
                  <tr className="border-b border-border last:border-0">
                    <td colSpan={7} className="bg-background px-4 py-3">
                      <table className="w-full text-xs">
                        <thead className="text-muted">
                          <tr>
                            <th className="px-2 py-1 text-left font-medium">Data</th>
                            <th className="px-2 py-1 text-left font-medium">Tipo</th>
                            <th className="px-2 py-1 text-right font-medium">Quantità</th>
                            <th className="px-2 py-1 text-right font-medium">Prezzo</th>
                            <th className="px-2 py-1 text-left font-medium">Costo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transazioniAsset.map((t) => (
                            <tr key={t.id} data-fb-entita={`transazione-investimento:${t.id}`} className="border-t border-border">
                              <td className="px-2 py-1.5 whitespace-nowrap text-muted">
                                {new Date(`${t.data}T00:00:00Z`).toLocaleDateString("it-IT")}
                              </td>
                              <td className="px-2 py-1.5 font-sans text-muted">
                                {t.tipo === "buy" ? "Acquisto" : "Vendita"}
                              </td>
                              <td className="px-2 py-1.5 text-right">{formatQuantita(t.quantita)}</td>
                              <td className="px-2 py-1.5 text-right">
                                {t.prezzo_unitario === null ? "n/d" : formatCurrency(t.prezzo_unitario)}
                              </td>
                              <td className="px-2 py-1.5 font-sans text-muted capitalize">{t.costo_tipo}</td>
                            </tr>
                          ))}
                          {transazioniAsset.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-2 py-3 text-center font-sans text-muted">
                                Nessuna transazione caricata per questo asset.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}

// Sotto i 768px la tabella a 7 colonne obbligava a scorrere in orizzontale
// (prezzo, valore e plus/minusvalenza restavano fuori schermo): qui una scheda
// per posizione, con gli stessi valori già calcolati dalla tabella.
function PositionsCards({
  posizioni,
  transazioni,
}: {
  posizioni: Posizione[];
  transazioni: TransazioneConAsset[];
}) {
  const [espansa, setEspansa] = useState<string | null>(null);

  return (
    <ul className="card divide-y divide-border md:hidden">
      {posizioni.map((p) => {
        const gainColor =
          p.plusvalenzaAssoluta === null
            ? "var(--muted)"
            : p.plusvalenzaAssoluta >= 0
              ? "var(--entrata)"
              : "var(--spesa)";
        const tipoColorVar = TIPO_ASSET_COLOR_VAR[p.asset.tipo] ?? "--muted";
        const aperta = espansa === p.asset.id;
        const transazioniAsset = transazioni.filter((t) => t.asset_id === p.asset.id);

        return (
          <li key={p.asset.id} data-fb-entita={`asset:${p.asset.isin ?? p.asset.ticker}`}>
            <button
              type="button"
              aria-expanded={aperta}
              onClick={() => setEspansa(aperta ? null : p.asset.id)}
              className="flex min-h-11 w-full flex-col gap-2 px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: `var(${tipoColorVar})` }} />
                <span className="min-w-0 flex-1 truncate font-medium">{p.asset.nome}</span>
                {p.hasStimato && <AlertTriangle role="img" aria-label="Include costi stimati" className="h-4 w-4 shrink-0 text-accent" />}
                {p.hasSconosciuto && (
                  <HelpCircle role="img" aria-label="Include quantità a costo sconosciuto" className="h-4 w-4 shrink-0 text-muted" />
                )}
                {aperta ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                )}
              </span>
              <span className="text-xs text-muted">
                {p.asset.ticker} · {TIPO_ASSET_LABEL[p.asset.tipo] ?? p.asset.tipo}
                {p.datiIncompleti && " · storico incompleto"}
              </span>
              <span className="font-figures flex items-baseline justify-between gap-3">
                <span className="importo text-base font-semibold">
                  {p.valoreAttuale === null ? "n/d" : formatCurrency(p.valoreAttuale)}
                </span>
                <span className="importo text-sm" style={{ color: gainColor }}>
                  {p.plusvalenzaAssoluta === null
                    ? "n/d"
                    : `${formatCurrency(p.plusvalenzaAssoluta)} (${formatPercent(p.plusvalenzaPercentuale ?? 0)})`}
                </span>
              </span>
              <span className="font-figures grid grid-cols-3 gap-2 text-xs text-muted">
                <span>
                  Quantità
                  <br />
                  <span className="text-foreground">{formatQuantita(p.quantitaValore)}</span>
                </span>
                <span>
                  Medio carico
                  <br />
                  <span className="text-foreground">
                    {p.costoMedioCarico === null ? "n/d" : formatCurrency(p.costoMedioCarico)}
                  </span>
                </span>
                <span>
                  Prezzo
                  <br />
                  <span className="text-foreground">
                    {p.prezzoAttuale === null ? "n/d" : formatCurrency(p.prezzoAttuale)}
                  </span>
                </span>
              </span>
            </button>
            {aperta && (
              <ul className="font-figures divide-y divide-border bg-background px-4 text-sm">
                {transazioniAsset.map((t) => (
                  <li key={t.id} data-fb-entita={`transazione-investimento:${t.id}`} className="flex justify-between gap-3 py-2">
                    <span className="text-muted">
                      {new Date(`${t.data}T00:00:00Z`).toLocaleDateString("it-IT")} · {t.tipo === "buy" ? "Acquisto" : "Vendita"}
                    </span>
                    <span>
                      {formatQuantita(t.quantita)} × {t.prezzo_unitario === null ? "n/d" : formatCurrency(t.prezzo_unitario)}
                    </span>
                  </li>
                ))}
                {transazioniAsset.length === 0 && (
                  <li className="py-3 text-center font-sans text-muted">Nessuna transazione caricata per questo asset.</li>
                )}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
