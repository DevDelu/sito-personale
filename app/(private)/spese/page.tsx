import type { Metadata } from "next";
import { getOverviewData, getSpesePerRicorrenti, getTotaliPeriodo, getUltimoInserimentoImport } from "@/lib/spese/queries";
import { giorniDalCaricamento } from "@/lib/spese/ultimo-import";
import { giorniPrimaISO, oggiItaliaISO } from "@/lib/cron/data-italia";
import { trovaRicorrenti } from "@/lib/spese/ricorrenti";
import { periodoPrecedente } from "@/lib/spese/confronto";
import { meseScorso } from "@/lib/spese/mese-scorso";
import { Overview } from "./overview";
import { Toast } from "@/components/toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";

// Le voci Overview/Gestione/Importa del segmented control mobile vengono da
// qui, senza duplicare le etichette. "+ Aggiungi" resta fuori: l'aggiunta
// passa dal "+" centrale della tab bar, il FAB in basso a destra è il
// feedback.
const SPESE_SEGMENTI = SIDEBAR_SECTIONS.find((s) => s.id === "spese")!.subsections!.filter(
  (s) => !s.label.startsWith("+")
);

export const metadata: Metadata = { title: "Spese" };

const DEFAULT_PRESET = "mese";

function presetRange(preset: string, oggi: string): { from: string; to: string } {
  if (preset === "7") return { from: giorniPrimaISO(oggi, 6), to: oggi };
  if (preset === "scorso") return meseScorso(oggi);
  return { from: `${oggi.slice(0, 7)}-01`, to: oggi };
}

export default async function SpesePage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; preset?: string; from?: string; to?: string }>;
}) {
  const { added, preset, from, to } = await searchParams;

  // Fuso Europe/Rome: il server è in UTC e dopo mezzanotte italiana "oggi" era
  // ancora ieri (il primo del mese, il mese precedente).
  const oggi = oggiItaliaISO();
  const range =
    from && to
      ? { from, to, preset: null }
      : { ...presetRange(preset ?? DEFAULT_PRESET, oggi), preset: preset ?? DEFAULT_PRESET };

  const prec = periodoPrecedente(range.from, range.to);
  const [{ spese, categorie, depositi }, spesePerRicorrenti, totaliPrec, ultimoImport] = await Promise.all([
    getOverviewData(range.from, range.to),
    getSpesePerRicorrenti(oggi),
    // Un errore nel confronto non deve rompere la pagina: la riga semplicemente non compare.
    prec ? getTotaliPeriodo(prec.from, prec.to).catch(() => null) : Promise.resolve(null),
    // Idem: senza la data la riga "Ultimo caricamento" non compare.
    getUltimoInserimentoImport().catch(() => null),
  ]);
  const giorniDaCaricamento = ultimoImport ? giorniDalCaricamento(ultimoImport) : null;
  const ricorrenti = trovaRicorrenti(spesePerRicorrenti, oggi);

  return (
    <div className="flex flex-col gap-6">
      {added && <Toast message="Movimento aggiunto" />}

      <PageHeader title="Spese" action={<PrivacyToggle />} />
      <SegmentedControl items={SPESE_SEGMENTI} />

      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Spese ed entrate</h1>
        <p className="text-sm text-muted">Panoramica di entrate, uscite e categorie di spesa.</p>
      </div>

      <Overview spese={spese} categorie={categorie} depositi={depositi} ricorrenti={ricorrenti} range={range} precedente={totaliPrec} giorniDaCaricamento={giorniDaCaricamento} />
    </div>
  );
}
