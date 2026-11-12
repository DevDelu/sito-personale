"use client";

import Link from "next/link";
import { Circle, CircleCheck, FlaskConical } from "lucide-react";
import { LEZIONI, LIVELLI } from "@/lib/trading/lezioni";
import { useProgressiTrading } from "@/hooks/useProgressiTrading";
import { ListGroup, ListRowLink } from "@/components/ui/ListGroup";

export function ElencoLezioni() {
  const { completate } = useProgressiTrading();
  const fatte = LEZIONI.filter((l) => completate.includes(l.slug)).length;
  const prossima = LEZIONI.find((l) => !completate.includes(l.slug));
  const percentuale = Math.round((fatte / LEZIONI.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div data-fb-area="trading.corso.progressi" className="contents">
        <section className="card flex flex-col gap-4 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[17px] font-semibold">I tuoi progressi</h2>
            <span className="font-figures text-[15px] text-muted">
              {fatte}/{LEZIONI.length} lezioni
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-surface-hover"
            role="progressbar"
            aria-valuenow={percentuale}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Lezioni completate"
          >
            <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${percentuale}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {prossima ? (
              <Link href={`/trading/${prossima.slug}`} className="btn-primary flex min-h-11 items-center">
                {fatte === 0 ? "Inizia" : "Continua"}: {prossima.titolo}
              </Link>
            ) : (
              <span className="text-[15px] text-entrata">Corso completato. Ora allenati nel laboratorio.</span>
            )}
            <Link href="/trading/laboratorio" className="btn-secondary flex min-h-11 items-center gap-1.5">
              <FlaskConical className="h-4 w-4" />
              Laboratorio
            </Link>
          </div>
        </section>
      </div>

      <div className="contents">
        {([1, 2, 3] as const).map((livello) => (
          <ListGroup key={livello} title={`Livello ${livello} · ${LIVELLI[livello].titolo}`}>
            {LEZIONI.filter((l) => l.livello === livello).map((l) => {
              const fatta = completate.includes(l.slug);
              return (
                <ListRowLink
                  key={l.slug}
                  href={`/trading/${l.slug}`}
                  icon={
                    fatta ? (
                      <CircleCheck className="h-5 w-5 text-entrata" strokeWidth={1.75} />
                    ) : (
                      <Circle className="h-5 w-5 text-muted" strokeWidth={1.75} />
                    )
                  }
                  title={l.titolo}
                  subtitle={l.sottotitolo}
                  value={`${l.minuti} min`}
                  chevron
                />
              );
            })}
          </ListGroup>
        ))}
      </div>
    </div>
  );
}
