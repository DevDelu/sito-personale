import type { Metadata } from "next";
import Link from "next/link";
import { Play } from "lucide-react";
import { getSchedeConMeta } from "@/lib/allenamento/queries";

export const metadata: Metadata = { title: "Allenamento" };

function formatUltimoUtilizzo(iso: string | null): string {
  if (!iso) return "Mai usata";
  return `Ultimo utilizzo: ${new Date(`${iso}T00:00:00Z`).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}`;
}

export default async function AllenamentoPage() {
  const schede = await getSchedeConMeta();

  if (schede.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Allenamento</h1>
        <p className="max-w-sm text-sm text-muted">
          Nessuna scheda configurata. Creane una per iniziare ad allenarti.
        </p>
        <Link href="/allenamenti/schede" className="btn-primary !px-6 !py-3 text-base">
          Vai a Le mie schede
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Avvia allenamento</h1>
        <p className="text-sm text-muted">Scegli la scheda da usare per questa sessione.</p>
      </div>

      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {schede.map((scheda) => {
          const avviabile = scheda.numEsercizi > 0;
          return (
            <div key={scheda.id} className="card card-hover flex flex-col gap-3 p-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-base font-semibold">{scheda.nome}</span>
                {scheda.descrizione && <p className="text-sm text-muted">{scheda.descrizione}</p>}
              </div>
              <span className="text-xs text-muted">
                {scheda.numEsercizi} {scheda.numEsercizi === 1 ? "esercizio" : "esercizi"} ·{" "}
                {formatUltimoUtilizzo(scheda.ultimoUtilizzo)}
              </span>

              {avviabile ? (
                <Link
                  href={`/allenamenti/sessione/nuova?scheda=${scheda.id}`}
                  className="btn-primary mt-auto flex items-center justify-center gap-2"
                >
                  <Play className="h-3.5 w-3.5" />
                  Avvia
                </Link>
              ) : (
                <p className="mt-auto text-xs text-muted">Aggiungi almeno un esercizio per poterla avviare.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
