import type { Pasto } from "@/lib/alimentazione/types";

const LABEL_TIPO: Record<string, string> = {
  colazione: "Colazione",
  pranzo: "Pranzo",
  cena: "Cena",
  spuntino: "Spuntino",
};

// Sola lettura: la Overview mostra i pasti di oggi solo come elenco, ogni
// modifica/eliminazione vive in Gestione (stesso principio Overview/Gestione
// di Spese, vedi CLAUDE.md).
export function TodayMealsList({ pasti }: { pasti: Pasto[] }) {
  if (pasti.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-6 text-center text-sm text-muted">
        <span>Nessun pasto registrato oggi.</span>
      </div>
    );
  }

  return (
    <ul className="card flex flex-col divide-y divide-border">
      {pasti.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{p.alimento_nome}</span>
            <span className="text-xs text-muted">
              {LABEL_TIPO[p.tipo_pasto] ?? p.tipo_pasto} · {p.quantita_g}g
            </span>
          </div>
          <span className="font-figures text-sm text-muted">{Math.round(p.kcal)} kcal</span>
        </li>
      ))}
    </ul>
  );
}
