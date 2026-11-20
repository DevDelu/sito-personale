"use client";

import { useState } from "react";
import { dimensionePosizione, rapportoRischioRendimento } from "@/lib/trading/indicatori";

const euro = (n: number) => n.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

function Campo({ etichetta, valore, onChange, passo = "0.01" }: { etichetta: string; valore: string; onChange: (v: string) => void; passo?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[13px] text-muted">{etichetta}</span>
      <input
        type="number"
        inputMode="decimal"
        step={passo}
        value={valore}
        onChange={(e) => onChange(e.target.value)}
        className="field-input min-h-11 text-[17px]"
      />
    </label>
  );
}

// Position sizing: quante azioni comprare perché lo stop costi al massimo
// la percentuale di capitale scelta. Tutto locale, niente viene salvato.
export function CalcolatoreRischio() {
  const [capitale, setCapitale] = useState("5000");
  const [rischio, setRischio] = useState("1");
  const [ingresso, setIngresso] = useState("180");
  const [stop, setStop] = useState("170");
  const [target, setTarget] = useState("200");

  const num = (s: string) => Number(s.replace(",", "."));
  const r = dimensionePosizione(num(capitale), num(rischio), num(ingresso), num(stop));
  const rr = rapportoRischioRendimento(num(ingresso), num(stop), num(target));
  const valido = r.azioni > 0;

  return (
    <div className="flex flex-col gap-4 rounded-[var(--app-card-radius)] border border-border bg-background p-4">
      <div className="grid grid-cols-2 gap-3">
        <Campo etichetta="Capitale per il trading (€)" valore={capitale} onChange={setCapitale} passo="100" />
        <Campo etichetta="Rischio per operazione (%)" valore={rischio} onChange={setRischio} passo="0.25" />
        <Campo etichetta="Prezzo di ingresso" valore={ingresso} onChange={setIngresso} />
        <Campo etichetta="Stop loss" valore={stop} onChange={setStop} />
        <Campo etichetta="Target" valore={target} onChange={setTarget} />
      </div>
      <dl className="grid grid-cols-2 gap-3 text-[15px]">
        <div className="flex flex-col">
          <dt className="text-[13px] text-muted">Azioni da comprare</dt>
          <dd className="font-figures text-[22px] font-semibold">{valido ? r.azioni : "—"}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-[13px] text-muted">Perdita se scatta lo stop</dt>
          <dd className="font-figures text-[22px] font-semibold text-spesa">{valido ? euro(r.azioni * r.rischioPerAzione) : "—"}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-[13px] text-muted">Controvalore posizione</dt>
          <dd className="font-figures">{valido ? euro(r.controvalore) : "—"}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-[13px] text-muted">Rischio / rendimento</dt>
          <dd className={`font-figures ${rr >= 2 ? "text-entrata" : rr > 0 && rr < 1.5 ? "text-spesa" : ""}`}>
            {rr > 0 ? `1 : ${rr.toFixed(1)}` : "—"}
          </dd>
        </div>
      </dl>
      {valido && r.controvalore > num(capitale) && (
        <p className="text-[13px] text-spesa">
          Il controvalore supera il capitale: lo stop è troppo vicino per questa percentuale di rischio, oppure serve meno rischio.
        </p>
      )}
      {rr > 0 && rr < 1.5 && (
        <p className="text-[13px] text-muted">Sotto 1:1,5 il potenziale guadagno ripaga poco il rischio: molti trader scartano il setup.</p>
      )}
    </div>
  );
}
