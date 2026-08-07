import type { Metadata } from "next";
import Link from "next/link";
import { Play } from "lucide-react";
import { getSchedaFullBodyCasa } from "@/lib/allenamento/queries";

export const metadata: Metadata = { title: "Allenamento" };

export default async function AllenamentoPage() {
  const scheda = await getSchedaFullBodyCasa();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Allenamento</h1>
        <p className="text-sm text-muted">Avvia la sessione di calisthenics e segui la scheda corrente.</p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Avvia allenamento</h2>
        {scheda ? (
          <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-sm font-semibold">{scheda.nome}</span>
              {scheda.descrizione && <span className="text-xs text-muted">{scheda.descrizione}</span>}
            </div>
            <Link
              href={`/allenamenti/sessione/nuova?scheda=${scheda.id}`}
              className="btn-primary flex items-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              Avvia sessione
            </Link>
          </div>
        ) : (
          <div className="card flex items-center justify-center p-6">
            <p className="text-sm text-muted">Nessuna scheda configurata.</p>
          </div>
        )}
      </div>
    </div>
  );
}
