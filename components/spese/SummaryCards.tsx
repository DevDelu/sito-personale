import { formatCurrency } from "@/lib/spese-utils";

export function SummaryCards({
  entrate,
  uscite,
  saldoAllTime,
}: {
  entrate: number;
  uscite: number;
  saldoAllTime: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card label="Entrate nel periodo" value={entrate} colorVar="--entrata" />
      <Card label="Uscite nel periodo" value={uscite} colorVar="--spesa" />
      <Card
        label="Saldo (dall'inizio)"
        value={saldoAllTime}
        colorVar={saldoAllTime >= 0 ? "--entrata" : "--spesa"}
      />
    </div>
  );
}

function Card({ label, value, colorVar }: { label: string; value: number; colorVar: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface px-4 py-3">
      <span className="text-xs text-muted">{label}</span>
      <span className="font-figures text-2xl font-semibold" style={{ color: `var(${colorVar})` }}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
