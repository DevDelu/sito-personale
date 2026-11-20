"use client";

import { useState } from "react";
import { Shuffle } from "lucide-react";
import { GraficoTrading } from "./GraficoTrading";

const SEME_INIZIALE = 2026;

// Palestra libera: un grafico casuale nuovo a ogni tocco, con tutti gli
// indicatori e gli strumenti di disegno. Nessun dato reale.
export function Laboratorio() {
  const [seme, setSeme] = useState(SEME_INIZIALE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setSeme((s) => (s * 48271 + 11) % 2147483647)}
          className="btn-primary flex min-h-11 items-center gap-1.5"
        >
          <Shuffle className="h-4 w-4" />
          Nuovo grafico
        </button>
        <span className="text-[13px] text-muted">Grafico n. {seme}</span>
      </div>
      <GraficoTrading
        key={seme}
        seme={seme}
        strumenti={["sma20", "sma50", "ema20", "bollinger", "volumi", "rsi", "macd"]}
        attiviIniziali={["volumi"]}
        disegno
        didascalia="Dati simulati. Prova a leggere il trend, segnare supporti e resistenze e tracciare una trendline prima di accendere gli indicatori."
      />
    </div>
  );
}
