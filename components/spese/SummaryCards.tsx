import { formatCurrency } from "@/lib/spese-utils";

export function SummaryCards({ entrate, uscite }: { entrate: number; uscite: number }) {
  const saldo = entrate - uscite;

  return (
    <>
      {/* Mobile: saldo del periodo come cifra grande, entrate/uscite come
          valori più piccoli affiancati sotto — non due card affiancate col
          bordo colorato (stile "cruscotto"), un unico blocco di riepilogo. */}
      <div className="card flex flex-col gap-3 px-4 py-4 md:hidden">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-muted">Saldo del periodo</span>
          <span
            className={`font-figures text-[32px] font-bold ${saldo >= 0 ? "text-entrata" : "text-spesa"}`}
          >
            {formatCurrency(saldo)}
          </span>
        </div>
        <div className="flex gap-6 border-t border-[var(--app-hairline)] pt-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] text-muted">Entrate</span>
            <span className="font-figures text-[17px] font-semibold text-entrata">
              {formatCurrency(entrate)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] text-muted">Uscite</span>
            <span className="font-figures text-[17px] font-semibold text-spesa">
              {formatCurrency(uscite)}
            </span>
          </div>
        </div>
      </div>

      <div className="hidden grid-cols-1 gap-4 sm:grid-cols-2 md:grid">
        <Card label="Entrate" value={entrate} colorVar="--entrata" />
        <Card label="Uscite" value={uscite} colorVar="--spesa" />
      </div>
    </>
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
