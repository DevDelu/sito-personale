import type { Metadata } from "next";
import Link from "next/link";
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

// recharts (~400KB) in un chunk separato dal bundle principale della route,
// stesso principio di ChartsSection in investimenti/spese (vedi commento
// lì): resta SSR, niente ssr:false, non supportato nei Server Component.
const WeeklyTrendChart = dynamic(() =>
  import("@/components/alimentazione/WeeklyTrendChart").then((m) => m.WeeklyTrendChart)
);

export const metadata: Metadata = { title: "Alimentazione" };

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
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
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Alimentazione</h1>
        <p className="text-sm text-muted">TDEE stimato, consumo di oggi e trend settimanale.</p>
      </div>

      {!riepilogo.ok && (
        <div className="card flex flex-col gap-2 p-4 text-sm">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard label="BMR stimato" value={`${riepilogo.bmr} kcal`} />
          <SummaryCard label="TDEE stimato" value={`${riepilogo.tdee} kcal`} />
          <SummaryCard label="Target kcal (fase attiva)" value={`${riepilogo.targetKcal} kcal`} highlight />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MacroProgressBars consumo={consumoOggi} target={targetMacro} />
        <WeeklyTrendChart punti={trend} targetKcal={targetKcal} />
      </div>

      <AderenzaCard settimana={aderenzaSettimana} mese={aderenzaMese} />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-medium text-muted">Pasti di oggi</h2>
          <Link href="/alimentazione/aggiungi" className="btn-primary !px-3 !py-1.5">
            + Aggiungi pasto
          </Link>
        </div>
        <TodayMealsList pasti={pastiOggi} />
      </section>
    </div>
  );
}

// "N/D" quando non c'è ancora abbastanza dato (nessun template configurato
// per i giorni/pasti loggati, o nessun pasto nel periodo) invece di un
// numero fuorviante — stesso spirito del ramo "non calcolabile" del TDEE.
function AderenzaCard({ settimana, mese }: { settimana: number | null; mese: number | null }) {
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-medium text-muted">Aderenza al piano</h2>
        <Link href="/alimentazione/template" className="text-xs font-medium text-accent hover:underline">
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
