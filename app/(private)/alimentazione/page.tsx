import type { Metadata } from "next";
import Link from "next/link";
import { oggiItaliaISO } from "@/lib/cron/data-italia";
import dynamic from "next/dynamic";
import {
  getAlimenti,
  getPastiByData,
  getPastiTraDate,
  getRiepilogoTdee,
  sommaMacro,
  trendSettimanale,
} from "@/lib/alimentazione/queries";
import { aderenzaMedia, getTemplatePasti } from "@/lib/alimentazione/template";
import { MacroProgressBars, stimaTargetMacro } from "@/components/alimentazione/MacroProgressBars";
import { TodayMealsList } from "@/components/alimentazione/TodayMealsList";
import { Toast } from "@/components/toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";

const ALIMENTAZIONE_SEGMENTI = SIDEBAR_SECTIONS.find((s) => s.id === "alimentazione")!.subsections!.filter(
  (s) => !s.label.startsWith("+")
);

// recharts (~400KB) in un chunk separato dal bundle principale della route,
// stesso principio di ChartsSection in investimenti/spese (vedi commento
// lì): resta SSR, niente ssr:false, non supportato nei Server Component.
const WeeklyTrendChart = dynamic(() =>
  import("@/components/alimentazione/WeeklyTrendChart").then((m) => m.WeeklyTrendChart)
);

export const metadata: Metadata = { title: "Alimentazione" };

// Date nel fuso Europe/Rome (stesso criterio dei cron): in UTC tra mezzanotte
// e le 1-2 italiane la pagina mostrava "ieri" come oggi.
function todayIso(): string {
  return oggiItaliaISO();
}

function daysAgoIso(days: number): string {
  const d = new Date(`${oggiItaliaISO()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

export default async function AlimentazionePage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string }>;
}) {
  const { added } = await searchParams;
  const oggi = todayIso();

  const [riepilogo, pastiOggi, pastiSettimana, pastiMese, templates, alimenti] = await Promise.all([
    getRiepilogoTdee(),
    getPastiByData(oggi),
    getPastiTraDate(daysAgoIso(7), oggi),
    getPastiTraDate(daysAgoIso(30), oggi),
    getTemplatePasti(),
    getAlimenti(),
  ]);

  const consumoOggi = sommaMacro(pastiOggi);
  const trend = trendSettimanale(pastiSettimana, oggi);

  const targetKcal = riepilogo.ok ? riepilogo.targetKcal : null;
  const targetMacro = riepilogo.ok ? stimaTargetMacro(riepilogo.targetKcal, riepilogo.pesoKg) : null;

  const aderenzaSettimana = aderenzaMedia(pastiSettimana, templates, alimenti, daysAgoIso(7), oggi);
  const aderenzaMese = aderenzaMedia(pastiMese, templates, alimenti, daysAgoIso(30), oggi);

  return (
    <div className="flex flex-col gap-6">
      {added && <Toast message="Pasto aggiunto" />}
      <PageHeader title="Alimentazione" />
      <SegmentedControl items={ALIMENTAZIONE_SEGMENTI} />

      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Alimentazione</h1>
        <p className="text-sm text-muted">TDEE stimato, consumo di oggi e trend settimanale.</p>
      </div>

      <section data-fb-area="alimentazione.overview.pasti-oggi" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-semibold md:font-display md:text-sm md:font-medium md:text-muted">Pasti di oggi</h2>
          <Link href="/alimentazione/aggiungi" className="btn-primary inline-flex min-h-[44px] items-center !px-3 !py-1.5">
            + Aggiungi pasto
          </Link>
        </div>
        <TodayMealsList pasti={pastiOggi} />
      </section>

      {!riepilogo.ok && (
        <div data-fb-area="alimentazione.overview.tdee" className="card flex flex-col gap-2 p-4 text-sm">
          {riepilogo.motivo === "profilo_incompleto" ? (
            <>
              <p>
                Completa il tuo profilo (altezza, età, sesso, livello di attività) per calcolare il TDEE stimato.
              </p>
              <Link href="/alimentazione/profilo" className="btn-primary self-start">
                Vai al profilo
              </Link>
            </>
          ) : (
            <>
              <p>Registra almeno un peso corporeo per calcolare il TDEE stimato.</p>
              <Link href="/alimentazione/profilo" className="btn-primary self-start">
                Registra il peso
              </Link>
            </>
          )}
        </div>
      )}

      {riepilogo.ok && (
        <div data-fb-area="alimentazione.overview.tdee" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard label="BMR stimato" value={`${riepilogo.bmr} kcal`} />
          <SummaryCard label="TDEE stimato" value={`${riepilogo.tdee} kcal`} />
          <SummaryCard label="Target kcal (fase attiva)" value={`${riepilogo.targetKcal} kcal`} highlight />
        </div>
      )}

      <div data-fb-area="alimentazione.overview.macro-trend" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MacroProgressBars consumo={consumoOggi} target={targetMacro} />
        <WeeklyTrendChart punti={trend} targetKcal={targetKcal} />
      </div>

      <AderenzaCard settimana={aderenzaSettimana} mese={aderenzaMese} />
    </div>
  );
}

// "N/D" quando non c'è ancora abbastanza dato (nessun template configurato
// per i giorni/pasti loggati, o nessun pasto nel periodo) invece di un
// numero fuorviante — stesso spirito del ramo "non calcolabile" del TDEE.
function AderenzaCard({ settimana, mese }: { settimana: number | null; mese: number | null }) {
  return (
    <div data-fb-area="alimentazione.overview.aderenza" className="card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-semibold md:font-display md:text-sm md:font-medium md:text-muted">Aderenza al piano</h2>
        <Link href="/alimentazione/template" className="inline-flex min-h-[44px] items-center text-[15px] font-medium text-accent hover:underline md:text-xs">
          Gestisci template
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AderenzaValue label="Ultimi 7 giorni" valore={settimana} />
        <AderenzaValue label="Ultimi 30 giorni" valore={mese} />
      </div>
    </div>
  );
}

function AderenzaValue({ label, valore }: { label: string; valore: number | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <span className="font-figures text-2xl font-semibold">
        {valore === null ? <span className="text-muted">N/D</span> : `${Math.round(valore * 100)}%`}
      </span>
    </div>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`card card-hover animate-slide-up flex flex-col gap-1 px-4 py-3 ${
        highlight ? "border-l-4 border-l-accent" : ""
      }`}
    >
      <span className="text-xs text-muted">{label}</span>
      <span className="font-figures text-2xl font-semibold">{value}</span>
    </div>
  );
}
