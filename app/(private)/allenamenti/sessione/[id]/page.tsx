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

  const [scheda, righe, logEsistenti] = await Promise.all([
    getScheda(sessione.scheda_id),
    getSchedaEsercizi(sessione.scheda_id),
    getLogPerSessione(id),
  ]);
  if (!scheda) notFound();

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
