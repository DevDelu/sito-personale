import { getAssets, getTransazioni } from "@/lib/investimenti/queries";
import { TransazioneTable } from "@/components/investimenti/TransazioneTable";

export default async function InvestimentiGestionePage() {
  const [transazioni, assets] = await Promise.all([getTransazioni(), getAssets()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Gestione investimenti</h1>
        <p className="text-sm text-muted">
          Ogni campo, incluso &ldquo;qualità del costo&rdquo;, è modificabile: aggiorna i dati stimati non
          appena hai quelli reali.
        </p>
      </div>

      <TransazioneTable rows={transazioni} assets={assets} />
    </div>
  );
}
