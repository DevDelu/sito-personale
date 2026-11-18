import { ExternalLink, RotateCcw, Sparkles, Wrench, Cog } from "lucide-react";
import type { NovitaRiga } from "@/lib/novita/queries";
import type { TipoNovita } from "@/lib/novita/testo-pr";
import { etichettaGiorno, giornoRoma } from "@/lib/novita/date";

// Modifiche andate online, raggruppate per giorno: prima ciò che cambia per
// Lorenzo (novità, correzioni, annullamenti), poi i lavori tecnici, ognuno
// con la sua spiegazione. Il link alla PR è solo per chi vuole i dettagli.

const ASPETTO: Record<TipoNovita, { etichetta: string; icona: typeof Sparkles; colore: string }> = {
  funzione: { etichetta: "Nuovo", icona: Sparkles, colore: "text-accent bg-accent/15" },
  correzione: { etichetta: "Sistemato", icona: Wrench, colore: "text-entrata bg-entrata/15" },
  annullata: { etichetta: "Annullato", icona: RotateCcw, colore: "text-spesa bg-spesa/15" },
  tecnico: { etichetta: "Tecnico", icona: Cog, colore: "text-muted bg-surface-hover" },
};

function LinkPr({ n }: { n: NovitaRiga }) {
  if (!n.pr_url) return null;
  return (
    <a
      href={n.pr_url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 items-center gap-1 text-[13px] text-muted underline-offset-2 hover:underline md:min-h-0"
    >
      Dettagli tecnici · PR #{n.pr_number} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
    </a>
  );
}

function Voce({ n }: { n: NovitaRiga }) {
  const a = ASPETTO[n.tipo];
  const Icona = a.icona;
  return (
    <li className="card flex gap-3 p-4" data-fb-entita={`novita:${n.id}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${a.colore}`} aria-hidden>
        <Icona className="h-[18px] w-[18px]" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-[13px] font-medium text-muted">{a.etichetta}</p>
        <h3 className="text-[17px] font-semibold leading-snug">{n.titolo}</h3>
        {n.spiegazione !== n.titolo ? (
          <p className="whitespace-pre-line text-[15px] text-foreground/85">{n.spiegazione}</p>
        ) : null}
        <LinkPr n={n} />
      </div>
    </li>
  );
}

function VoceTecnica({ n }: { n: NovitaRiga }) {
  return (
    <li className="flex flex-col gap-0.5 py-2.5" data-fb-entita={`novita:${n.id}`}>
      <p className="text-[15px] font-medium">{n.titolo}</p>
      {n.spiegazione !== n.titolo ? <p className="text-[15px] text-muted">{n.spiegazione}</p> : null}
      <LinkPr n={n} />
    </li>
  );
}

export function NovitaElenco({ novita }: { novita: NovitaRiga[] }) {
  if (novita.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-8 text-center">
        <Sparkles className="h-6 w-6 text-accent" aria-hidden />
        <p className="text-[17px] font-semibold">Ancora niente qui</p>
        <p className="max-w-sm text-[15px] text-muted">
          Ogni volta che una modifica va online la trovi qui, spiegata a parole semplici. Le prime arrivano col prossimo
          deploy.
        </p>
      </div>
    );
  }

  const giorni = new Map<string, NovitaRiga[]>();
  for (const n of novita) {
    const g = giornoRoma(n.online_dal);
    giorni.set(g, [...(giorni.get(g) ?? []), n]);
  }

  return (
    <div className="flex flex-col gap-8">
      {[...giorni.entries()].map(([giorno, voci]) => {
        const perTe = voci.filter((v) => v.tipo !== "tecnico");
        const tecnici = voci.filter((v) => v.tipo === "tecnico");
        return (
          <section key={giorno} className="flex flex-col gap-3" aria-labelledby={`giorno-${giorno}`}>
            <h2 id={`giorno-${giorno}`} className="text-[22px] font-bold tracking-tight">
              {etichettaGiorno(giorno)}
            </h2>
            {perTe.length ? (
              <ul className="flex flex-col gap-3">
                {perTe.map((n) => (
                  <Voce key={n.id} n={n} />
                ))}
              </ul>
            ) : null}
            {tecnici.length ? (
              <div className="card px-4 py-2">
                <p className="flex items-center gap-2 pt-2 text-[13px] font-medium text-muted">
                  <Cog className="h-4 w-4" aria-hidden />
                  {tecnici.length === 1
                    ? "Lavoro tecnico · non cambia cosa vedi"
                    : `${tecnici.length} lavori tecnici · non cambiano cosa vedi`}
                </p>
                <ul className="divide-y divide-[var(--app-hairline)]">
                  {tecnici.map((n) => (
                    <VoceTecnica key={n.id} n={n} />
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
