import type { Metadata } from "next";
import Link from "next/link";
import { Play } from "lucide-react";
import { getSchedaFullBodyCasa } from "@/lib/allenamento/queries";

export const metadata: Metadata = { title: "Allenamento" };

export default async function AllenamentoPage() {
  const scheda = await getSchedaFullBodyCasa();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {scheda?.nome ?? "Allenamento"}
        </h1>
        {scheda?.descrizione && <p className="max-w-sm text-sm text-muted">{scheda.descrizione}</p>}
      </div>

      {scheda ? (
        <Link
          href={`/allenamenti/sessione/nuova?scheda=${scheda.id}`}
          className="btn-primary flex items-center gap-2 !px-6 !py-3 text-base"
        >
          <Play className="h-4 w-4" />
          Avvia sessione
        </Link>
      ) : (
        <p className="text-sm text-muted">Nessuna scheda configurata.</p>
      )}
    </div>
  );
}
