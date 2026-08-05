import type { Metadata } from "next";
import { getSessioni, getUltimeSessioniConLog } from "@/lib/allenamento/queries";
import { SessionsHistoryTable } from "@/components/allenamento/SessionsHistoryTable";
import { ProgressTable } from "@/components/allenamento/ProgressTable";

export const metadata: Metadata = { title: "Allenamento · Storico" };

export default async function StoricoAllenamentoPage() {
  const [sessioni, progressi] = await Promise.all([getSessioni(), getUltimeSessioniConLog(30)]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Storico</h1>
        <p className="text-sm text-muted">{sessioni.length} sessioni registrate.</p>
      </div>

      <SessionsHistoryTable sessioni={sessioni} />

      <ProgressTable sessioni={progressi.sessioni} log={progressi.log} />
    </div>
  );
}
