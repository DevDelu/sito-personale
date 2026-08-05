import type { Metadata } from "next";
import Link from "next/link";
import { Play } from "lucide-react";
import { getImpegniFissi, getSchedaFullBodyCasa } from "@/lib/allenamento/queries";
import { WeeklyPlanGrid } from "@/components/allenamento/WeeklyPlanGrid";

export const metadata: Metadata = { title: "Allenamento" };

export default async function AllenamentoPage() {
  const [impegni, scheda] = await Promise.all([getImpegniFissi(), getSchedaFullBodyCasa()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Allenamento</h1>
        <p className="text-sm text-muted">Boxe e nuoto come impegni fissi, calisthenics con tracking completo.</p>
      </div>

      {scheda && (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-sm font-semibold">{scheda.nome}</span>
            {scheda.descrizione && <span className="text-xs text-muted">{scheda.descrizione}</span>}
          </div>
          <Link href={`/allenamenti/sessione/nuova?scheda=${scheda.id}`} className="btn-primary flex items-center gap-1.5">
            <Play className="h-3.5 w-3.5" />
            Avvia sessione
          </Link>
        </div>
      )}

      <WeeklyPlanGrid impegni={impegni} />
    </div>
  );
}
