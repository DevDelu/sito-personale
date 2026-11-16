import { formatCurrency, formatPercent } from "@/lib/investimenti/format";

// Riga "Oggi": freccia e segno oltre al colore, così su/giù si distingue
// anche senza vedere i colori. Gli importi sono nascosti dalla modalità
// discreta (classe importo) e non finiscono in aria-label.
export function VariazioneOggi({
  importo,
  percentuale,
  mostraImporto = true,
  className = "",
}: {
  importo: number;
  percentuale: number | null;
  mostraImporto?: boolean;
  className?: string;
}) {
  const su = importo >= 0;
  const colorVar = su ? "--entrata" : "--spesa";
  const segno = su ? "+" : "−";
  return (
    <span className={`font-figures inline-flex items-baseline gap-1 whitespace-nowrap ${className}`} style={{ color: `var(${colorVar})` }}>
      <span aria-hidden="true">{su ? "▲" : "▼"}</span>
      <span className="sr-only">Oggi {su ? "in salita" : "in discesa"}:</span>
      {mostraImporto && (
        <span className="importo">
          {segno}
          {formatCurrency(Math.abs(importo))}
        </span>
      )}
      {percentuale !== null && <span>{mostraImporto ? `(${formatPercent(percentuale)})` : formatPercent(percentuale)}</span>}
    </span>
  );
}
