import { formatCurrency } from "@/lib/spese-utils";
import { variazionePercentuale } from "@/lib/spese/confronto";

type Totali = { entrate: number; uscite: number };

// Riga "▲ 12% rispetto al periodo precedente". Per le uscite salire è un
// peggioramento (colore spesa), per le entrate un miglioramento.
function Confronto({ attuale, precedente, tipo }: { attuale: number; precedente: number | undefined; tipo: "entrate" | "uscite" }) {
  if (precedente === undefined) return null;
  const v = variazionePercentuale(attuale, precedente);
  if (v === null) return null;
  const sale = v > 0;
  const buono = tipo === "uscite" ? v < 0 : v > 0;
  const colore = v === 0 ? "text-muted" : buono ? "text-entrata" : "text-spesa";
  const freccia = v === 0 ? "=" : sale ? "▲" : "▼";
  return (
    <span className={`text-[13px] ${colore}`}>
      <span aria-hidden>{freccia}</span> {Math.abs(v)}% rispetto al periodo precedente
      <span className="sr-only">{v === 0 ? ", invariato" : sale ? ", in aumento" : ", in calo"}</span>
    </span>
  );
}

export function SummaryCards({ entrate, uscite, precedente = null }: { entrate: number; uscite: number; precedente?: Totali | null }) {
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
            className={`importo font-figures text-[32px] font-bold ${saldo >= 0 ? "text-entrata" : "text-spesa"}`}
          >
            {formatCurrency(saldo)}
          </span>
        </div>
        <div className="flex flex-col gap-3 border-t border-[var(--app-hairline)] pt-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] text-muted">Entrate</span>
            <span className="importo font-figures text-[17px] font-semibold text-entrata">
              {formatCurrency(entrate)}
            </span>
            <Confronto attuale={entrate} precedente={precedente?.entrate} tipo="entrate" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] text-muted">Uscite</span>
            <span className="importo font-figures text-[17px] font-semibold text-spesa">
              {formatCurrency(uscite)}
            </span>
            <Confronto attuale={uscite} precedente={precedente?.uscite} tipo="uscite" />
          </div>
        </div>
      </div>

      <div className="hidden grid-cols-1 gap-4 sm:grid-cols-2 md:grid">
        <Card label="Entrate" value={entrate} colorVar="--entrata" confronto={<Confronto attuale={entrate} precedente={precedente?.entrate} tipo="entrate" />} />
        <Card label="Uscite" value={uscite} colorVar="--spesa" confronto={<Confronto attuale={uscite} precedente={precedente?.uscite} tipo="uscite" />} />
      </div>
    </>
  );
}

function Card({ label, value, colorVar, confronto }: { label: string; value: number; colorVar: string; confronto?: React.ReactNode }) {
  return (
    <div
      className="card card-hover animate-slide-up flex flex-col gap-1 border-l-4 px-4 py-3"
      style={{ borderLeftColor: `var(${colorVar})` }}
    >
      <span className="text-xs text-muted">{label}</span>
      <span className="importo font-figures text-2xl font-semibold" style={{ color: `var(${colorVar})` }}>
        {formatCurrency(value)}
      </span>
      {confronto}
    </div>
  );
}
