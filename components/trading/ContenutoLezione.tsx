import { AlertTriangle, Cpu, Target } from "lucide-react";
import type { Blocco } from "@/lib/trading/lezioni";
import { GraficoTrading } from "./GraficoTrading";
import { AnatomiaCandela, PatternCandele } from "./SchemiCandele";
import { CalcolatoreRischio } from "./CalcolatoreRischio";
import { CicloSettori, CurvaRendimenti } from "./SchemiMacro";

// Unica formattazione ammessa nei testi delle lezioni: **grassetto**.
function Testo({ testo }: { testo: string }) {
  return (
    <>
      {testo.split(/(\*\*[^*]+\*\*)/g).map((pezzo, i) =>
        pezzo.startsWith("**") ? (
          <strong key={i} className="font-semibold text-foreground">
            {pezzo.slice(2, -2)}
          </strong>
        ) : (
          pezzo
        ),
      )}
    </>
  );
}

export function ContenutoLezione({ blocchi }: { blocchi: Blocco[] }) {
  return (
    <div className="flex flex-col gap-6">
      {blocchi.map((b, i) => {
        switch (b.tipo) {
          case "testo":
            return (
              <p key={i} className="text-[17px] leading-relaxed text-foreground/90">
                <Testo testo={b.testo} />
              </p>
            );
          case "punti":
            return (
              <div key={i} className="flex flex-col gap-2">
                {b.titolo && <h3 className="text-[17px] font-semibold">{b.titolo}</h3>}
                <ul className="flex flex-col gap-2 pl-5 text-[17px] leading-relaxed text-foreground/90 [list-style:disc]">
                  {b.voci.map((v) => (
                    <li key={v}>
                      <Testo testo={v} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          case "grafico":
            return (
              <GraficoTrading
                key={i}
                scenarioId={b.scenario}
                strumenti={b.strumenti}
                attiviIniziali={b.attivi}
                disegno={b.disegno}
                didascalia={b.didascalia}
              />
            );
          case "anatomia":
            return <AnatomiaCandela key={i} />;
          case "pattern-candele":
            return <PatternCandele key={i} />;
          case "calcolatore":
            return <CalcolatoreRischio key={i} />;
          case "schema":
            return b.nome === "curva-rendimenti" ? <CurvaRendimenti key={i} /> : <CicloSettori key={i} />;
          case "tabella":
            return (
              <div key={i} className="flex flex-col gap-2">
                {b.titolo && <h3 className="text-[17px] font-semibold">{b.titolo}</h3>}
                <div className="overflow-x-auto rounded-[var(--app-card-radius)] border border-border">
                  <table className="w-full min-w-[20rem] border-collapse text-left text-[15px]">
                    <thead className="bg-surface-hover text-[13px] text-muted">
                      <tr>
                        {b.intestazioni.map((h) => (
                          <th key={h} scope="col" className="px-3 py-2 font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {b.righe.map((r) => (
                        <tr key={r.join("|")}>
                          {r.map((c, k) => (
                            <td key={k} className={`px-3 py-2 align-top ${k === 0 ? "font-medium" : "text-foreground/85"}`}>
                              <Testo testo={c} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          case "frasi":
            return (
              <div key={i} className="flex flex-col gap-2">
                {b.titolo && <h3 className="text-[17px] font-semibold">{b.titolo}</h3>}
                <dl className="flex flex-col divide-y divide-border rounded-[var(--app-card-radius)] border border-border">
                  {b.voci.map((v) => (
                    <div key={v.frase} className="flex flex-col gap-1 px-4 py-3">
                      <dt className="text-[15px] font-semibold text-accent">{v.frase}</dt>
                      <dd className="text-[15px] leading-relaxed">{v.significato}</dd>
                      {v.esempio && <dd className="text-[13px] italic text-muted">{v.esempio}</dd>}
                    </div>
                  ))}
                </dl>
              </div>
            );
          case "pratica":
            return (
              <aside key={i} className="flex gap-3 rounded-[var(--app-card-radius)] bg-accent/10 p-4">
                <Target className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-semibold uppercase tracking-wide text-accent">Mettilo in pratica</span>
                  <p className="text-[15px] leading-relaxed">
                    <Testo testo={b.testo} />
                  </p>
                </div>
              </aside>
            );
          case "nvda":
            return (
              <aside key={i} className="flex gap-3 rounded-[var(--app-card-radius)] bg-entrata/10 p-4">
                <Cpu className="mt-0.5 h-5 w-5 shrink-0 text-entrata" />
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-semibold uppercase tracking-wide text-entrata">Applicalo a NVDA</span>
                  <p className="text-[15px] leading-relaxed">
                    <Testo testo={b.testo} />
                  </p>
                </div>
              </aside>
            );
          case "attenzione":
            return (
              <aside key={i} className="flex gap-3 rounded-[var(--app-card-radius)] bg-spesa/10 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-spesa" />
                <p className="text-[15px] leading-relaxed">
                  <Testo testo={b.testo} />
                </p>
              </aside>
            );
        }
      })}
    </div>
  );
}
