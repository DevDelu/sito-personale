"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
import { useAgendaMutations } from "@/hooks/useAgendaMutations";
import { EventoFormModal } from "./EventoFormModal";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import type { EventoPatch } from "@/app/(private)/agenda/actions";
import type { Evento, NotaGiorno } from "@/lib/agenda/types";

type Tab = "eventi" | "note" | "posta";
type MailMessage = { id: string; da: string; a: string; oggetto: string; snippet: string; data: string };
type MailRisposta = { ricevute: MailMessage[]; inviate: MailMessage[] };

const TABS: { value: Tab; label: string }[] = [
  { value: "eventi", label: "Eventi" },
  { value: "note", label: "Note" },
  { value: "posta", label: "Posta" },
];

function formatDataLunga(data: string): string {
  return new Date(`${data}T00:00:00Z`).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function formatOra(iso: string, tuttoIlGiorno: boolean): string {
  if (tuttoIlGiorno) return "Tutto il giorno";
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

export function DayPanel({
  data,
  eventi,
  notaIniziale,
  onClose,
}: {
  data: string;
  eventi: Evento[];
  notaIniziale: NotaGiorno | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { crea, aggiorna, elimina, salvaNota, pending, error } = useAgendaMutations();
  const [tab, setTab] = useState<Tab>("eventi");

  const [formAperto, setFormAperto] = useState(false);
  const [eventoInModifica, setEventoInModifica] = useState<Evento | null>(null);
  const [eventoDaEliminare, setEventoDaEliminare] = useState<Evento | null>(null);

  const [nota, setNota] = useState(notaIniziale?.contenuto ?? "");
  const [salvandoNota, setSalvandoNota] = useState(false);

  const [mail, setMail] = useState<MailRisposta | null>(null);
  const [mailCaricamento, setMailCaricamento] = useState(false);
  const [mailErrore, setMailErrore] = useState<string | null>(null);
  const [mailCaricata, setMailCaricata] = useState(false);

  // Cambio giorno selezionato (nuove props dal calendario): riallinea lo
  // stato locale invece di lasciare la nota/mail del giorno precedente.
  const [dataCorrente, setDataCorrente] = useState(data);
  if (data !== dataCorrente) {
    setDataCorrente(data);
    setNota(notaIniziale?.contenuto ?? "");
    setMail(null);
    setMailCaricata(false);
    setMailErrore(null);
    setTab("eventi");
  }

  // Autosave con debounce ~800ms, nessun bottone "Salva" per la nota.
  useEffect(() => {
    if (nota === (notaIniziale?.contenuto ?? "")) return;
    const timer = setTimeout(async () => {
      setSalvandoNota(true);
      try {
        await salvaNota(dataCorrente, nota);
      } catch {
        // errore già mostrato via `error` dell'hook
      } finally {
        setSalvandoNota(false);
      }
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nota]);

  async function caricaMail() {
    if (mailCaricata || mailCaricamento) return;
    setMailCaricamento(true);
    setMailErrore(null);
    try {
      const res = await fetch(`/api/agenda/mail?data=${dataCorrente}`);
      const json = await res.json();
      if (!res.ok) {
        setMailErrore(json.error ?? "Impossibile caricare la posta.");
        return;
      }
      setMail(json);
      setMailCaricata(true);
    } catch {
      setMailErrore("Impossibile caricare la posta.");
    } finally {
      setMailCaricamento(false);
    }
  }

  function handleTabClick(t: Tab) {
    setTab(t);
    if (t === "posta") caricaMail();
  }

  async function handleSalvaEvento(patch: EventoPatch) {
    if (eventoInModifica) await aggiorna(eventoInModifica.id, patch);
    else await crea(patch);
    setFormAperto(false);
    setEventoInModifica(null);
    router.refresh();
  }

  async function handleEliminaEvento() {
    if (!eventoDaEliminare) return;
    await elimina(eventoDaEliminare.id);
    setEventoDaEliminare(null);
    router.refresh();
  }

  return (
    <div className="card flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold capitalize">{formatDataLunga(dataCorrente)}</h2>
        <button type="button" onClick={onClose} aria-label="Chiudi pannello" className="btn-icon">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex w-fit items-center gap-0.5 rounded-full border border-border p-0.5">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => handleTabClick(t.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 ease-out ${
              tab === t.value ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "eventi" && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              setEventoInModifica(null);
              setFormAperto(true);
            }}
            className="btn-secondary flex w-fit items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuovo evento
          </button>

          {eventi.length === 0 ? (
            <p className="text-sm text-muted">Nessun evento in questo giorno.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {eventi.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-2 rounded-xl border border-border p-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-medium">{e.titolo}</span>
                    <span className="font-figures text-xs text-muted">{formatOra(e.data_inizio, e.tutto_il_giorno)}</span>
                    {e.luogo && <span className="text-xs text-muted">{e.luogo}</span>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEventoInModifica(e);
                        setFormAperto(true);
                      }}
                      aria-label="Modifica evento"
                      className="btn-icon"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventoDaEliminare(e)}
                      aria-label="Elimina evento"
                      className="btn-icon hover:!text-spesa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "note" && (
        <div className="flex flex-col gap-1.5">
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={10}
            placeholder="Scrivi una nota per questo giorno..."
            className="field-input"
          />
          <span className="text-xs text-muted">{salvandoNota ? "Salvataggio..." : "Salvataggio automatico"}</span>
        </div>
      )}

      {tab === "posta" && (
        <div className="flex flex-col gap-3">
          {mailCaricamento && <p className="text-sm text-muted">Caricamento posta...</p>}
          {mailErrore && <p className="text-sm text-spesa">{mailErrore}</p>}
          {mail && (
            <>
              <MailSection titolo="Ricevute" messaggi={mail.ricevute} />
              <MailSection titolo="Inviate" messaggi={mail.inviate} />
              {mail.ricevute.length === 0 && mail.inviate.length === 0 && (
                <p className="text-sm text-muted">Nessuna mail in questo giorno.</p>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-spesa" role="alert">
          {error}
        </p>
      )}

      {formAperto && (
        <EventoFormModal
          evento={eventoInModifica}
          dataIniziale={{ data: dataCorrente }}
          pending={pending}
          error={error}
          onSave={handleSalvaEvento}
          onCancel={() => {
            setFormAperto(false);
            setEventoInModifica(null);
          }}
        />
      )}

      {eventoDaEliminare && (
        <DeleteConfirmDialog
          titolo={eventoDaEliminare.titolo}
          title="Eliminare questo evento?"
          description={
            <>
              &ldquo;{eventoDaEliminare.titolo}&rdquo; verrà rimosso definitivamente
              {eventoDaEliminare.google_event_id ? " (anche da Google Calendar, se raggiungibile)" : ""}.
            </>
          }
          pending={pending}
          onConfirm={handleEliminaEvento}
          onCancel={() => setEventoDaEliminare(null)}
        />
      )}
    </div>
  );
}

function MailSection({ titolo, messaggi }: { titolo: string; messaggi: MailMessage[] }) {
  if (messaggi.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{titolo}</span>
      <ul className="flex flex-col gap-2">
        {messaggi.map((m) => (
          <li key={m.id} className="flex flex-col gap-1 rounded-xl border border-border p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{m.oggetto}</span>
              <a
                href={`https://mail.google.com/mail/u/0/#inbox/${m.id}`}
                target="_blank"
                rel="noreferrer"
                className="btn-icon shrink-0"
                aria-label="Apri in Gmail"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <span className="truncate text-xs text-muted">{m.da || m.a}</span>
            <span className="truncate text-xs text-muted/70">{m.snippet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
