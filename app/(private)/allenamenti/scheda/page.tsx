import type { Metadata } from "next";
import { getEsercizi, getSchedaEsercizi, getSchedaFullBodyCasa } from "@/lib/allenamento/queries";
import { SchedaEditor } from "@/components/allenamento/SchedaEditor";

export const metadata: Metadata = { title: "Allenamento · Gestione scheda" };

export default async function GestioneSchedaPage() {
  const scheda = await getSchedaFullBodyCasa();

  if (!scheda) {
    return (
      <div className="card flex items-center justify-center p-6">
        <p className="text-sm text-muted">Nessuna scheda configurata.</p>
      </div>
    );
  }

  const [righe, catalogo] = await Promise.all([getSchedaEsercizi(scheda.id), getEsercizi()]);

  return <SchedaEditor scheda={scheda} righe={righe} catalogo={catalogo} />;
}
