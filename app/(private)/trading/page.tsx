import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";
import { ElencoLezioni } from "@/components/trading/ElencoLezioni";

export const metadata: Metadata = { title: "Scuola di mercati" };

const SEGMENTI = SIDEBAR_SECTIONS.find((s) => s.id === "trading")!.subsections!;

export default function TradingPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Scuola" parent={{ href: "/altro", label: "Altro" }} />
      <SegmentedControl items={SEGMENTI} />

      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Scuola di mercati</h1>
        <p className="text-sm text-muted">
          Dalle basi della Borsa a Fed, bilanci, analisi tecnica e gergo: per capire un commento di mercato e discuterne con
          cognizione.
        </p>
      </div>
      <p className="text-[15px] text-muted md:hidden">
        Dalle basi della Borsa a Fed, bilanci, analisi tecnica e gergo: per capire un commento di mercato e discuterne con
        cognizione.
      </p>

      <div data-fb-area="trading.corso.lezioni" className="contents">
        <ElencoLezioni />
      </div>

      <p className="text-[13px] text-muted">
        I grafici delle lezioni usano dati simulati, costruiti per mostrare ogni concetto. Le regole fiscali sono aggiornate al 2026. Contenuto formativo, non consulenza
        finanziaria.
      </p>
    </div>
  );
}
