"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { prezziDaAggiornare } from "@/lib/investimenti/aggiornamento";

const CHIAVE_ULTIMO = "investimenti:ultimo-aggiornamento-prezzi";

function leggiUltimo(): number | null {
  try {
    const v = localStorage.getItem(CHIAVE_ULTIMO);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

function salvaUltimo(ms: number) {
  try {
    localStorage.setItem(CHIAVE_ULTIMO, String(ms));
  } catch {
    // storage non disponibile: al prossimo avvio riaggiorna, pazienza
  }
}

function formatOra(ms: number): string {
  return new Date(ms).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

// I prezzi arrivavano solo dal cron giornaliero (Vercel Hobby: un cron al
// giorno), quindi sembravano fermi. All'apertura della pagina, se l'ultimo
// aggiornamento è più vecchio di INTERVALLO_AGGIORNAMENTO_MS, li riscarica
// da Yahoo/CoinGecko e ricarica i dati; il pulsante forza l'aggiornamento.
export function AggiornaPrezzi() {
  const router = useRouter();
  const [inCorso, setInCorso] = useState(false);
  const [ultimo, setUltimo] = useState<number | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  const aggiorna = useCallback(async () => {
    setInCorso(true);
    setErrore(null);
    try {
      const res = await fetch("/api/investimenti/aggiorna-prezzi", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrore(json.error ?? "Aggiornamento prezzi non riuscito.");
        return;
      }
      const adesso = Date.now();
      salvaUltimo(adesso);
      setUltimo(adesso);
      const errori: { messaggio: string }[] = json.errori ?? [];
      if (errori.length > 0) {
        setErrore(
          `${errori.length} prezz${errori.length === 1 ? "o non aggiornato" : "i non aggiornati"}: ${errori
            .map((e) => e.messaggio)
            .join(" · ")}`
        );
      }
      router.refresh();
    } catch {
      setErrore("Aggiornamento prezzi non riuscito.");
    } finally {
      setInCorso(false);
    }
  }, [router]);

  // localStorage esiste solo nel browser: letto dopo il mount, in un
  // callback (non nel corpo dell'effetto) per non innescare render a cascata.
  useEffect(() => {
    const timer = setTimeout(() => {
      const precedente = leggiUltimo();
      if (prezziDaAggiornare(precedente, Date.now())) {
        void aggiorna();
      } else if (precedente !== null) {
        setUltimo(precedente);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [aggiorna]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <span>
          {inCorso
            ? "Aggiorno i prezzi…"
            : ultimo !== null
              ? `Prezzi aggiornati alle ${formatOra(ultimo)}`
              : "Prezzi dall'ultimo aggiornamento"}
        </span>
        <button
          type="button"
          onClick={() => void aggiorna()}
          disabled={inCorso}
          aria-label="Aggiorna prezzi"
          title="Aggiorna prezzi"
          className="btn-icon"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${inCorso ? "animate-spin" : ""}`} />
        </button>
      </div>
      {errore && (
        <p className="text-xs text-spesa" role="alert">
          {errore}
        </p>
      )}
    </div>
  );
}
