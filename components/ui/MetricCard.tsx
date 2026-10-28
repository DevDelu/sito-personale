// Card di riepilogo con bordo sinistro colorato ("indicatore da cruscotto"),
// condivisa tra i moduli dell'area privata (finora duplicata localmente in
// Spese e Investimenti come funzione interna "Card").
export function MetricCard({
  label,
  value,
  colorVar,
  note,
  importo = false,
}: {
  label: string;
  value: string;
  colorVar: string;
  note?: string;
  // true se il valore è un importo in euro: con la modalità discreta è sfocato.
  importo?: boolean;
}) {
  return (
    <div
      className="card card-hover max-md:animate-none flex flex-col gap-1 border-l-4 px-4 py-3 max-md:border-l-0"
      style={{ borderLeftColor: `var(${colorVar})` }}
    >
      <span className="text-xs text-muted">{label}</span>
      <span className={`${importo ? "importo " : ""}font-figures text-2xl font-semibold`} style={{ color: `var(${colorVar})` }}>
        {value}
      </span>
      {note && <span className="text-xs text-muted">{note}</span>}
    </div>
  );
}
