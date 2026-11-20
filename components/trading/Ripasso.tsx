"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { LEZIONI, MODULI, type ModuloId } from "@/lib/trading/lezioni";
import type { Domanda } from "@/lib/trading/tipi";

type DomandaRipasso = Domanda & { slug: string; titoloLezione: string };

const TUTTE: DomandaRipasso[] = LEZIONI.flatMap((l) => l.quiz.map((q) => ({ ...q, slug: l.slug, titoloLezione: l.titolo })));
const NUMERO = 10;

function estrai(modulo: ModuloId | "tutti"): DomandaRipasso[] {
  const pool = modulo === "tutti" ? TUTTE : TUTTE.filter((d) => LEZIONI.find((l) => l.slug === d.slug)?.modulo === modulo);
  const copia = [...pool];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, NUMERO);
}

// Ripasso a domande miste: 10 domande pescate da tutte le lezioni (o da un
// modulo), una alla volta, con punteggio e link alle lezioni sbagliate.
export function Ripasso() {
  const [modulo, setModulo] = useState<ModuloId | "tutti">("tutti");
  const [domande, setDomande] = useState<DomandaRipasso[] | null>(null);
  const [indice, setIndice] = useState(0);
  const [scelta, setScelta] = useState<number | null>(null);
  const [errori, setErrori] = useState<DomandaRipasso[]>([]);

  function inizia() {
    setDomande(estrai(modulo));
    setIndice(0);
    setScelta(null);
    setErrori([]);
  }

  if (!domande) {
    return (
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-[13px] text-muted">Argomento</span>
          <select value={modulo} onChange={(e) => setModulo(e.target.value as ModuloId | "tutti")} className="field-input min-h-11 text-[17px]">
            <option value="tutti">Tutto il corso ({TUTTE.length} domande)</option>
            {MODULI.map((m) => (
              <option key={m.id} value={m.id}>
                {m.titolo}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={inizia} className="btn-primary min-h-11 self-start">
          Inizia il ripasso
        </button>
      </div>
    );
  }

  const finito = indice >= domande.length;
  if (finito) {
    const giuste = domande.length - errori.length;
    return (
      <div className="flex flex-col gap-4">
        <p className="font-figures text-[32px] font-bold">
          {giuste}/{domande.length}
        </p>
        <p className="text-[15px] text-muted">
          {giuste === domande.length
            ? "Perfetto. Prova un altro giro o un modulo diverso."
            : giuste >= domande.length * 0.7
              ? "Buona base. Rivedi le lezioni qui sotto."
              : "Vale la pena ripassare le lezioni qui sotto prima del prossimo giro."}
        </p>
        {errori.length > 0 && (
          <ul className="flex flex-col gap-2">
            {[...new Map(errori.map((e) => [e.slug, e])).values()].map((e) => (
              <li key={e.slug}>
                <Link href={`/trading/${e.slug}`} className="inline-flex min-h-11 items-center text-[15px] font-medium text-accent">
                  {e.titoloLezione} →
                </Link>
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={inizia} className="btn-primary min-h-11 self-start">
          Nuovo giro
        </button>
      </div>
    );
  }

  const d = domande[indice];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3 text-[13px] text-muted">
        <span>
          Domanda {indice + 1} di {domande.length}
        </span>
        <span className="truncate">{d.titoloLezione}</span>
      </div>
      <p className="text-[17px] font-medium">{d.domanda}</p>
      <div className="flex flex-col gap-2">
        {d.opzioni.map((o, k) => {
          const giusta = k === d.corretta;
          const stato = scelta === null ? "" : giusta ? "border-entrata bg-entrata/10" : scelta === k ? "border-spesa bg-spesa/10" : "opacity-60";
          return (
            <button
              key={o}
              type="button"
              disabled={scelta !== null}
              onClick={() => {
                setScelta(k);
                if (k !== d.corretta) setErrori((e) => [...e, d]);
              }}
              className={`flex min-h-11 items-center justify-between gap-3 rounded-[12px] border border-border px-3 py-2 text-left text-[15px] ${stato}`}
            >
              <span>{o}</span>
              {scelta !== null && giusta && <Check className="h-4 w-4 shrink-0 text-entrata" />}
              {scelta === k && !giusta && <X className="h-4 w-4 shrink-0 text-spesa" />}
            </button>
          );
        })}
      </div>
      {scelta !== null && (
        <>
          <p className="text-[15px] text-muted">{d.spiegazione}</p>
          <button
            type="button"
            onClick={() => {
              setIndice((i) => i + 1);
              setScelta(null);
            }}
            className="btn-primary min-h-11 self-start"
          >
            {indice + 1 < domande.length ? "Avanti" : "Vedi il risultato"}
          </button>
        </>
      )}
    </div>
  );
}
