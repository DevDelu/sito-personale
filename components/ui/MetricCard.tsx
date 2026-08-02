// Card di riepilogo con bordo sinistro colorato ("indicatore da cruscotto"),
// condivisa tra i moduli dell'area privata (finora duplicata localmente in
// Spese e Investimenti come funzione interna "Card").
export function MetricCard({
  label,
  value,
  colorVar,
  note,
}: {
  label: string;
  value: string;
  colorVar: string;
  note?: string;
}) {
  return (
    <div
      className="card card-hover animate-slide-up flex flex-col gap-1 border-l-4 px-4 py-3"
      style={{ borderLeftColor: `var(${colorVar})` }}
    >
      <span className="text-xs text-muted">{label}</span>
      <span className="font-figures text-2xl font-semibold" style={{ color: `var(${colorVar})` }}>
        {value}
      </span>
      {note && <span className="text-xs text-muted">{note}</span>}
    </div>
  );
}
