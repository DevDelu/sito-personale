"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as chrono from "chrono-node";
import { Plus } from "lucide-react";
import { useAgendaMutations } from "@/hooks/useAgendaMutations";
import { EventoFormModal } from "./EventoFormModal";
import type { EventoPatch } from "@/app/(private)/agenda/actions";

// Il supporto chrono-node all'italiano è solo parziale (pieno per
// fi/fr/ja/nl/ru/uk/vi, parziale per it/de/es/pt/sv/zh): se il parsing
// fallisce o non trova nessuna data, si apre comunque il form di creazione
// con il testo digitato come titolo e i campi data/ora vuoti da compilare a
// mano — non blocca mai l'utente su un parsing fallito.
export function QuickAddBar() {
  const router = useRouter();
  const { crea, pending, error } = useAgendaMutations();
  const [testo, setTesto] = useState("");
  const [formAperto, setFormAperto] = useState(false);
  const [bozzaTitolo, setBozzaTitolo] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const testoPulito = testo.trim();
    if (!testoPulito) return;

    const risultati = chrono.it.parse(testoPulito, new Date(), { forwardDate: true });
    if (risultati.length === 0) {
      setBozzaTitolo(testoPulito);
      setFormAperto(true);
      return;
    }

    const risultato = risultati[0];
    const inizio = risultato.start.date();
    const fine = risultato.end ? risultato.end.date() : new Date(inizio.getTime() + 60 * 60 * 1000);
    // Il titolo è il testo rimasto fuori dal frammento riconosciuto come
    // data, altrimenti l'evento si chiamerebbe letteralmente "domani alle 15".
    const titolo =
      `${testoPulito.slice(0, risultato.index).trim()} ${testoPulito
        .slice(risultato.index + risultato.text.length)
        .trim()}`.trim() || testoPulito;
    const tuttoIlGiorno = !risultato.start.isCertain("hour");

    creaVeloce(titolo, inizio, fine, tuttoIlGiorno);
  }

  async function creaVeloce(titolo: string, inizio: Date, fine: Date, tuttoIlGiorno: boolean) {
    try {
      await crea({
        titolo,
        descrizione: null,
        luogo: null,
        data_inizio: inizio.toISOString(),
        data_fine: fine.toISOString(),
        tutto_il_giorno: tuttoIlGiorno,
        categoria: "personale",
      });
      setTesto("");
      router.refresh();
    } catch {
      // errore mostrato via `error` dell'hook, il testo resta per correggere
    }
  }

  async function handleSalvaForm(patch: EventoPatch) {
    await crea(patch);
    setFormAperto(false);
    setTesto("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          placeholder='Aggiungi al volo: "domani alle 15 dal dentista"'
          className="field-input flex-1"
        />
        <button
          type="submit"
          disabled={pending || !testo.trim()}
          className="btn-primary flex shrink-0 items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Aggiungi
        </button>
      </form>
      {error && <p className="text-sm text-spesa">{error}</p>}

      {formAperto && (
        <EventoFormModal
          evento={null}
          dataIniziale={{ data: new Date().toISOString().slice(0, 10), titoloIniziale: bozzaTitolo }}
          pending={pending}
          error={error}
          onSave={handleSalvaForm}
          onCancel={() => setFormAperto(false)}
        />
      )}
    </div>
  );
}
