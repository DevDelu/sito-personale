import { formatCurrency } from "@/lib/spese-utils";
import { confrontaTotali } from "@/lib/spese/confronto";

// Riga "▲ 12% rispetto al periodo precedente". Per le uscite salire è un male
// (colore spesa), per le entrate un bene; se non c'è un periodo precedente con
// dati, la riga non compare.
function RigaConfronto({ corrente, precedente, tipo }: { corrente: number; precedente: number | undefined; tipo: "entrata" | "spesa" }) {
  const c = precedente === undefined ? null : confrontaTotali(corrente, precedente);
  if (!c) return null;
  const simbolo = c.direzione === "su" ? "▲" : c.direzione === "giu" ? "▼" : "=";
  const bene = c.direzione === "uguale" ? null : (c.direzione === "su") === (tipo === "entrata");
  const colore = bene === null ? "text-muted" : bene ? "text-entrata" : "text-spesa";
  return (
    <span className={`text-[13px] ${colore}`}>
      {simbolo} {c.percentuale}% rispetto al periodo precedente
    </span>
  );
}

export function SummaryCards({
  entrate,
  uscite,
  precedenti = null,
}: {
  entrate: number;
  uscite: number;
  precedenti?: { spese: number; entrate: number } | null;
}) {
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
        <div className="flex gap-6 border-t border-[var(--app-hairline)] pt-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] text-muted">Entrate</span>
            <span className="importo font-figures text-[17px] font-semibold text-entrata">
              {formatCurrency(entrate)}
            </span>
            <RigaConfronto corrente={entrate} precedente={precedenti?.entrate} tipo="entrata" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] text-muted">Uscite</span>
            <span className="importo font-figures text-[17px] font-semibold text-spesa">
              {formatCurrency(uscite)}
            </span>
            <RigaConfronto corrente={uscite} precedente={precedenti?.spese} tipo="spesa" />
          </div>
        </div>
      </div>

      <div className="hidden grid-cols-1 gap-4 sm:grid-cols-2 md:grid">
        <Card label="Entrate" value={entrate} colorVar="--entrata" confronto={<RigaConfronto corrente={entrate} precedente={precedenti?.entrate} tipo="entrata" />} />
        <Card label="Uscite" value={uscite} colorVar="--spesa" confronto={<RigaConfronto corrente={uscite} precedente={precedenti?.spese} tipo="spesa" />} />
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
