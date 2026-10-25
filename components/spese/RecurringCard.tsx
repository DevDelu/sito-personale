import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { formatCurrency } from "@/lib/spese-utils";
import { totaleAnnuo, type Cadenza, type Ricorrente } from "@/lib/spese/ricorrenti";

const ETICHETTA_CADENZA: Record<Cadenza, string> = {
  settimanale: "Settimanale",
  mensile: "Mensile",
  annuale: "Annuale",
};

function formatData(iso: string): string {
  const [a, m, g] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(a, m - 1, g))
  );
}

// Sola lettura: l'Overview non scrive mai (decision log). I dati arrivano già
// calcolati da trovaRicorrenti() nella pagina server.
export function RecurringCard({ ricorrenti }: { ricorrenti: Ricorrente[] }) {
  if (ricorrenti.length === 0) {
    return (
      <section className="card flex flex-col gap-1 px-4 py-4">
        <h2 className="text-[22px] font-semibold md:text-lg">Ricorrenti</h2>
        <p className="text-[15px] text-muted md:text-sm">
          Nessuna uscita ricorrente trovata negli ultimi 13 mesi. Ne servono almeno tre addebiti regolari con lo stesso
          titolo e lo stesso importo.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="card flex flex-col gap-0.5 px-4 py-4">
        <h2 className="text-[22px] font-semibold md:text-lg">Ricorrenti</h2>
        <span className="text-[13px] text-muted">Costo stimato su 12 mesi</span>
        <span className="font-figures text-[32px] font-bold text-spesa md:text-2xl">
          {formatCurrency(totaleAnnuo(ricorrenti))}
        </span>
      </div>
      <ListGroup>
        {ricorrenti.map((r) => (
          <ListRow
            key={`${r.titolo}-${r.cadenza}`}
            title={r.titolo}
            subtitle={`${ETICHETTA_CADENZA[r.cadenza]}${r.importoAumentato ? " · importo aumentato" : ""} · prossimo ${formatData(r.prossimaData)}`}
            value={
              <span className={r.importoAumentato ? "text-spesa" : undefined}>
                {r.importoAumentato ? "▲ " : ""}
                {formatCurrency(r.importoTipico)}
              </span>
            }
          />
        ))}
      </ListGroup>
    </section>
  );
}
