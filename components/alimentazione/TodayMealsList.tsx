import type { Pasto } from "@/lib/alimentazione/types";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";

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
    <ListGroup>
      {pasti.map((p) => (
        <div key={p.id} data-fb-entita={`pasto:${p.id}`}>
          <ListRow
            title={p.alimento_nome}
            subtitle={`${LABEL_TIPO[p.tipo_pasto] ?? p.tipo_pasto} · ${p.quantita_g}g`}
            value={`${Math.round(p.kcal)} kcal`}
          />
        </div>
      ))}
    </ListGroup>
  );
}
