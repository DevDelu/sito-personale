import { getAssets, getRiconciliazioneAsset, getTransazioni } from "@/lib/investimenti/queries";
import { TransazioneTable } from "@/components/investimenti/TransazioneTable";
import { RiconciliazioneBanner } from "@/components/investimenti/RiconciliazioneBanner";

export default async function InvestimentiGestionePage() {
  const [transazioni, assets, riconciliazione] = await Promise.all([
    getTransazioni(),
    getAssets(),
    getRiconciliazioneAsset(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Gestione investimenti</h1>
        <p className="text-sm text-muted">
          Ogni campo, incluso &ldquo;qualità del costo&rdquo;, è modificabile: aggiorna i dati stimati non
          appena hai quelli reali.
        </p>
      </div>

      <RiconciliazioneBanner righe={riconciliazione} />

      <TransazioneTable rows={transazioni} assets={assets} />
    </div>
  );
}
