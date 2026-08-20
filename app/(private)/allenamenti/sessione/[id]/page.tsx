import { notFound } from "next/navigation";
import {
  getLogPerSessione,
  getScheda,
  getSchedaEsercizi,
  getSessione,
  getUltimoLogPerSchedaEsercizio,
} from "@/lib/allenamento/queries";
import { SessionRunner } from "@/components/allenamento/SessionRunner";

export default async function SessionePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const sessione = await getSessione(id);
  if (!sessione || !sessione.scheda_id) notFound();

  const [scheda, righeLive, logEsistenti] = await Promise.all([
    getScheda(sessione.scheda_id),
    sessione.scheda_snapshot ? Promise.resolve(null) : getSchedaEsercizi(sessione.scheda_id),
    getLogPerSessione(id),
  ]);
  if (!scheda) notFound();

  // Storicità: usa lo snapshot congelato all'avvio se presente (vedi
  // creaSessione), altrimenti la scheda live (sessioni create prima di
  // 019_allenamento_schede.sql, che non hanno ancora uno snapshot).
  const righe = sessione.scheda_snapshot ?? righeLive!;

  const righeNormali = righe.filter((r) => r.tipo_riga === "normale");
  const ultimiValoriEntries = await Promise.all(
    righeNormali.map(async (r) => [r.id, await getUltimoLogPerSchedaEsercizio(r.id, id)] as const)
  );

  return (
    <SessionRunner
      sessione={sessione}
      scheda={scheda}
      righe={righe}
      logEsistenti={logEsistenti}
      ultimiValori={Object.fromEntries(ultimiValoriEntries)}
    />
  );
}
