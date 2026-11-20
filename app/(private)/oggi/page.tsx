import Link from "next/link";
import { CalendarDays, Apple, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListGroup, ListRow, ListRowLink } from "@/components/ui/ListGroup";
import { oggiItaliaISO } from "@/lib/cron/data-italia";
import { getEventiRange } from "@/lib/agenda/queries";
import { eventiDiOggi } from "@/lib/agenda/digest";
import { getPastiByData, getRiepilogoTdee, sommaMacro } from "@/lib/alimentazione/queries";
import { getTotaliPeriodo } from "@/lib/spese/queries";

// "Cosa c'è oggi?" in sola lettura: agenda, kcal e spesa del giorno. Ogni
// riga rimanda al modulo; una sezione che non si carica mostra un testo
// leggibile invece di rompere la pagina.

function giornoPiu(iso: string, giorni: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + giorni);
  return d.toISOString().slice(0, 10);
}

function oraRoma(iso: string): string {
  return new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(iso)
  );
}

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export default async function OggiPage() {
  const oggi = oggiItaliaISO();
  const [eventiRes, pastiRes, tdeeRes, speseRes] = await Promise.allSettled([
    getEventiRange(giornoPiu(oggi, -1), giornoPiu(oggi, 2)),
    getPastiByData(oggi),
    getRiepilogoTdee(),
    getTotaliPeriodo(oggi, oggi),
  ]);

  const eventi = eventiRes.status === "fulfilled" ? eventiDiOggi(eventiRes.value, oggi) : null;
  const kcal = pastiRes.status === "fulfilled" ? Math.round(sommaMacro(pastiRes.value).kcal) : null;
  const target = tdeeRes.status === "fulfilled" && tdeeRes.value.ok ? tdeeRes.value.targetKcal : null;
  const uscite = speseRes.status === "fulfilled" ? speseRes.value.uscite : null;

  const dataLunga = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${oggi}T12:00:00Z`));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Oggi" parent={{ href: "/altro", label: "Altro" }} />
      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Oggi</h1>
        <p className="text-sm text-muted first-letter:uppercase">{dataLunga}</p>
      </div>
      <p className="-mt-3 px-1 text-[15px] text-muted first-letter:uppercase md:hidden">{dataLunga}</p>

      <section data-fb-area="oggi.agenda" className="flex flex-col gap-3">
        <ListGroup title="Agenda">
          {eventi === null ? (
            <ListRow icon={<CalendarDays className="h-5 w-5" strokeWidth={1.75} />} title="Agenda non disponibile" subtitle="Riprova tra poco" />
          ) : eventi.length === 0 ? (
            <ListRowLink
              href="/agenda"
              icon={<CalendarDays className="h-5 w-5" strokeWidth={1.75} />}
              title="Nessun evento oggi"
              chevron
            />
          ) : (
            eventi.slice(0, 5).map((e) => (
              <ListRowLink
                key={e.id}
                href="/agenda"
                icon={<CalendarDays className="h-5 w-5" strokeWidth={1.75} />}
                title={e.titolo}
                subtitle={e.tutto_il_giorno ? "Tutto il giorno" : `Alle ${oraRoma(e.data_inizio)}`}
                chevron
              />
            ))
          )}
        </ListGroup>
        {eventi && eventi.length > 5 && (
          <Link href="/agenda" className="px-1 text-[15px] text-accent">
            e altri {eventi.length - 5} eventi
          </Link>
        )}
      </section>

      <section data-fb-area="oggi.pasti">
        <ListGroup title="Alimentazione">
          <ListRowLink
            href="/alimentazione"
            icon={<Apple className="h-5 w-5" strokeWidth={1.75} />}
            title={kcal === null ? "Pasti non disponibili" : `${kcal} kcal oggi`}
            subtitle={target !== null && kcal !== null ? `Obiettivo ${target} kcal` : "Imposta il profilo per vedere l'obiettivo"}
            chevron
          />
        </ListGroup>
      </section>

      <section data-fb-area="oggi.spese">
        <ListGroup title="Spese">
          <ListRowLink
            href="/spese"
            icon={<Wallet className="h-5 w-5" strokeWidth={1.75} />}
            title={uscite === null ? "Spese non disponibili" : "Speso oggi"}
            value={uscite === null ? undefined : <span className="importo">{euro.format(uscite)}</span>}
            chevron
          />
        </ListGroup>
      </section>
    </div>
  );
}
