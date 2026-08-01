import { AlertTriangle } from "lucide-react";
import { formatQuantita } from "@/lib/investimenti/format";
import type { Riconciliazione } from "@/lib/investimenti/queries";

export function RiconciliazioneBanner({ righe }: { righe: Riconciliazione[] }) {
  if (righe.length === 0) return null;

  return (
    <div className="animate-slide-down flex flex-col gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 font-medium text-accent">
        <AlertTriangle className="h-4 w-4" />
        Storico transazioni incompleto
      </div>
      <ul className="flex flex-col gap-1 text-muted">
        {righe.map((r) => (
          <li key={r.asset.id}>
            <span className="font-medium text-foreground">{r.asset.nome}</span>: transazioni caricate ={" "}
            {formatQuantita(r.quantitaCalcolata)}, riferimento manuale ={" "}
            {formatQuantita(r.asset.quantita_riferimento_manuale ?? 0)} — mancano{" "}
            {formatQuantita(Math.abs(r.differenza))} unità da giustificare con transazioni reali.
          </li>
        ))}
      </ul>
    </div>
  );
}
