import { formatCurrency } from "@/lib/spese-utils";

export function SummaryCards({ entrate, uscite }: { entrate: number; uscite: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card label="Entrate" value={entrate} colorVar="--entrata" />
      <Card label="Uscite" value={uscite} colorVar="--spesa" />
    </div>
  );
}

function Card({ label, value, colorVar }: { label: string; value: number; colorVar: string }) {
  return (
    <div
      className="card card-hover animate-slide-up flex flex-col gap-1 border-l-4 px-4 py-3"
      style={{ borderLeftColor: `var(${colorVar})` }}
    >
      <span className="text-xs text-muted">{label}</span>
      <span className="font-figures text-2xl font-semibold" style={{ color: `var(${colorVar})` }}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
