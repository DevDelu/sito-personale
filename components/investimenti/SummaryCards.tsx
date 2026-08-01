import { formatCurrency, formatPercent } from "@/lib/investimenti/format";

export function SummaryCards({
  totaleInvestito,
  valoreAttuale,
  plusvalenzaAssoluta,
  plusvalenzaPercentuale,
}: {
  totaleInvestito: number;
  valoreAttuale: number;
  plusvalenzaAssoluta: number | null;
  plusvalenzaPercentuale: number | null;
}) {
  const gainColorVar = plusvalenzaAssoluta === null ? "--muted" : plusvalenzaAssoluta >= 0 ? "--entrata" : "--spesa";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card label="Totale investito" value={formatCurrency(totaleInvestito)} colorVar="--accent" />
      <Card label="Valore attuale" value={formatCurrency(valoreAttuale)} colorVar="--accent" />
      <Card
        label="Plus/minusvalenza"
        value={
          plusvalenzaAssoluta === null
            ? "n/d"
            : `${formatCurrency(plusvalenzaAssoluta)} (${formatPercent(plusvalenzaPercentuale ?? 0)})`
        }
        colorVar={gainColorVar}
      />
    </div>
  );
}

function Card({ label, value, colorVar }: { label: string; value: string; colorVar: string }) {
  return (
    <div
      className="card card-hover animate-slide-up flex flex-col gap-1 border-l-4 px-4 py-3"
      style={{ borderLeftColor: `var(${colorVar})` }}
    >
      <span className="text-xs text-muted">{label}</span>
      <span className="font-figures text-2xl font-semibold" style={{ color: `var(${colorVar})` }}>
        {value}
      </span>
    </div>
  );
}
