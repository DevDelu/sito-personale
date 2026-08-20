import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEsercizi, getScheda, getSchedaEsercizi } from "@/lib/allenamento/queries";
import { SchedaEditor } from "@/components/allenamento/SchedaEditor";

export const metadata: Metadata = { title: "Allenamento · Gestione scheda" };

export default async function GestioneSchedaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scheda = await getScheda(id);
  if (!scheda) notFound();

  const [righe, catalogo] = await Promise.all([getSchedaEsercizi(scheda.id), getEsercizi()]);

  return <SchedaEditor scheda={scheda} righe={righe} catalogo={catalogo} />;
}
