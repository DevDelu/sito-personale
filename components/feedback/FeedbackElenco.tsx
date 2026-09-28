"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, ExternalLink } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { SegmentedPicker } from "@/components/ui/SegmentedControl";
import { aggiungiNota, correggiTesto, rispondi, scarta, segnaNonRisolto, segnaVerificato } from "@/app/(private)/feedback/actions";
import { notificaDaVerificareCambiati, preparaEvidenziazione } from "@/lib/feedback/bus";
import { etichettaArea } from "@/lib/feedback/aree";
import { etaInNotti } from "@/lib/feedback/riepilogo";
import { ETICHETTA_STATO, STATI_APERTI, isNonChiuso } from "@/lib/feedback/stati";
import type { FeedbackEvento, FeedbackRow, FeedbackStato, FeedbackTipo } from "@/lib/feedback/types";

const REPO = "https://github.com/DevDelu/sito-personale";

type Gruppo = "aperti" | "da-verificare" | "chiusi";

const GRUPPI: { value: Gruppo; label: string }[] = [
  { value: "aperti", label: "Aperti" },
  { value: "da-verificare", label: "Da verificare" },
  { value: "chiusi", label: "Chiusi" },
];

const TIPO: Record<FeedbackTipo, string> = { problema: "Problema", complicato: "Complicato", idea: "Idea" };

function gruppo(stato: FeedbackStato): Gruppo {
  if (stato === "da-verificare") return "da-verificare";
  return STATI_APERTI.includes(stato) ? "aperti" : "chiusi";
}

// Colore del badge di stato: ambra dove serve Lorenzo, verde a buon fine.
function toneStato(stato: FeedbackStato): string {
  if (stato === "serve-info" || stato === "da-verificare" || stato === "riaperto") return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
  if (stato === "verificato") return "bg-entrata/15 text-entrata";
  return "bg-surface-hover text-muted";
}

function dove(f: Pick<FeedbackRow, "area" | "route">): string {
  return etichettaArea(f.area) ?? f.route;
}

export function FeedbackElenco({ righe, owner }: { righe: FeedbackRow[]; owner: boolean }) {
  const daVerificare = righe.filter((r) => r.stato === "da-verificare").length;
  const [scelto, setScelto] = useState<Gruppo>(daVerificare > 0 ? "da-verificare" : "aperti");
  const [dettaglioId, setDettaglioId] = useState<string | null>(null);
  const dettaglio = righe.find((r) => r.id === dettaglioId) ?? null;

  const visibili = useMemo(() => {
    const lista = righe.filter((r) => gruppo(r.stato) === scelto);
    // "Serve una tua risposta" in cima agli Aperti.
    return lista.sort((a, b) => Number(b.stato === "serve-info") - Number(a.stato === "serve-info"));
  }, [righe, scelto]);

  return (
    <>
      <SegmentedPicker label="Stato dei feedback" items={GRUPPI} value={scelto} onChange={setScelto} />

      {visibili.length === 0 ? (
        <p className="py-8 text-center text-[15px] text-muted">
          {scelto === "da-verificare" ? "Niente da verificare." : scelto === "aperti" ? "Nessun feedback aperto." : "Nessun feedback chiuso."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibili.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => setDettaglioId(f.id)}
                className="card flex w-full flex-col gap-1.5 p-4 text-left active:bg-surface-hover"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-muted">{TIPO[f.tipo]}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[12px] font-medium ${toneStato(f.stato)}`}>
                    {ETICHETTA_STATO[f.stato]}
                  </span>
                </span>
                <span className="line-clamp-2 text-[17px]">{f.testo}</span>
                <span className="flex items-center justify-between gap-2 text-[13px] text-muted">
                  <span className="min-w-0 truncate">{dove(f)}</span>
                  <span className="shrink-0">{etaInNotti(f.created_at)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {dettaglio && <FeedbackDettaglio key={dettaglio.id} f={dettaglio} owner={owner} onClose={() => setDettaglioId(null)} />}
    </>
  );
}

const DESCRIZIONE_EVENTO: Record<FeedbackEvento["tipo"], string> = {
  "cambio-stato": "Stato",
  nota: "Nota",
  domanda: "Domanda",
  risposta: "Risposta",
  "nota-fix": "Cosa è cambiato",
};

const AUTORE: Record<FeedbackEvento["autore"], string> = { lorenzo: "Tu", agente: "Agente", sistema: "Sistema" };

type Modo = null | "nota" | "rispondi" | "non-risolto" | "scarta" | "correggi";

function FeedbackDettaglio({ f, owner, onClose }: { f: FeedbackRow; owner: boolean; onClose: () => void }) {
  const router = useRouter();
  const [eventi, setEventi] = useState<FeedbackEvento[] | null>(null);
  const [modo, setModo] = useState<Modo>(null);
  const [testo, setTesto] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let attivo = true;
    fetch(`/api/feedback/${f.id}`)
      .then((r) => (r.ok ? r.json() : { eventi: [] }))
      .then((d: { eventi: FeedbackEvento[] }) => attivo && setEventi(d.eventi))
      .catch(() => attivo && setEventi([]));
    return () => {
      attivo = false;
    };
  }, [f.id, f.updated_at]);

  const domanda = eventi?.filter((e) => e.tipo === "domanda").at(-1)?.testo ?? null;

  function esegui(azione: () => Promise<{ ok: true } | { ok: false; errore: string }>, chiudiDopo = false) {
    setErrore(null);
    startTransition(async () => {
      const esito = await azione();
      if (!esito.ok) {
        setErrore(esito.errore);
        return;
      }
      setModo(null);
      setTesto("");
      notificaDaVerificareCambiati();
      router.refresh();
      if (chiudiDopo) onClose();
    });
  }

  function conferma() {
    if (modo === "nota") esegui(() => aggiungiNota(f.id, testo));
    else if (modo === "rispondi") esegui(() => rispondi(f.id, testo));
    else if (modo === "non-risolto") esegui(() => segnaNonRisolto(f.id, testo));
    else if (modo === "scarta") esegui(() => scarta(f.id, testo), true);
    else if (modo === "correggi") esegui(() => correggiTesto(f.id, testo));
  }

  function vaiAlPunto() {
    if (f.punto?.selettore) preparaEvidenziazione(f.punto.selettore);
    router.push(f.url ?? f.route);
  }

  const placeholder: Record<Exclude<Modo, null>, string> = {
    nota: "Cosa vuoi aggiungere?",
    rispondi: "La tua risposta",
    "non-risolto": "Cosa non va ancora? (facoltativo)",
    scarta: "Motivo (facoltativo)",
    correggi: "Testo del feedback",
  };
  const testoObbligatorio = modo === "nota" || modo === "rispondi" || modo === "correggi";

  return (
    <Sheet onClose={onClose} area="feedback.dettaglio" className="max-w-lg">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-muted">
            {TIPO[f.tipo]} · {etaInNotti(f.created_at)}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${toneStato(f.stato)}`}>
            {ETICHETTA_STATO[f.stato]}
          </span>
        </div>

        <p className="text-[17px] whitespace-pre-wrap">{f.testo}</p>

        {f.stato === "serve-info" && domanda && (
          <div className="rounded-xl bg-amber-500/10 p-3 text-[15px]">
            <span className="block text-[13px] font-medium text-amber-700 dark:text-amber-300">Serve una tua risposta</span>
            {domanda}
          </div>
        )}

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[15px]">
          <dt className="text-muted">Pagina</dt>
          <dd className="min-w-0 truncate">{f.route}</dd>
          {f.area && (
            <>
              <dt className="text-muted">Area</dt>
              <dd className="min-w-0">{etichettaArea(f.area) ?? f.area}</dd>
            </>
          )}
          {f.punto && (
            <>
              <dt className="text-muted">Punto</dt>
              <dd className="min-w-0">
                {f.punto.ruolo}
                {f.punto.etichetta ? ` · ${f.punto.etichetta}` : ""}
              </dd>
            </>
          )}
        </dl>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={vaiAlPunto} className="btn-secondary flex items-center gap-1.5 !px-3 !py-1.5">
            <Crosshair className="h-4 w-4" /> Vai al punto
          </button>
          {f.issue_number && (
            <a
              href={`${REPO}/issues/${f.issue_number}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary flex items-center gap-1.5 !px-3 !py-1.5"
            >
              Issue #{f.issue_number} <ExternalLink className="h-3.5 w-3.5" aria-label="(nuova scheda)" />
            </a>
          )}
          {f.pr_number && (
            <a
              href={`${REPO}/pull/${f.pr_number}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary flex items-center gap-1.5 !px-3 !py-1.5"
            >
              PR #{f.pr_number} <ExternalLink className="h-3.5 w-3.5" aria-label="(nuova scheda)" />
            </a>
          )}
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="text-[13px] font-medium text-muted uppercase">Storia</h3>
          {eventi === null ? (
            <p className="text-[15px] text-muted">Caricamento…</p>
          ) : eventi.length === 0 ? (
            <p className="text-[15px] text-muted">Nessun evento.</p>
          ) : (
            <ol className="flex flex-col gap-2 border-l border-border pl-3">
              {eventi.map((e) => (
                <li key={e.id} className="flex flex-col text-[15px]">
                  <span className="text-[13px] text-muted">
                    {new Date(e.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" })} ·{" "}
                    {AUTORE[e.autore]} · {DESCRIZIONE_EVENTO[e.tipo]}
                    {e.stato_a ? `: ${ETICHETTA_STATO[e.stato_a]}` : ""}
                  </span>
                  {e.testo && <span className="whitespace-pre-wrap">{e.testo}</span>}
                </li>
              ))}
            </ol>
          )}
        </section>

        {owner && modo && (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              rows={3}
              value={testo}
              maxLength={modo === "correggi" ? 500 : 1000}
              onChange={(e) => setTesto(e.target.value)}
              placeholder={placeholder[modo]}
              aria-label={placeholder[modo]}
              className="field-input w-full resize-none text-[17px]"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModo(null)} className="btn-secondary">
                Annulla
              </button>
              <button
                type="button"
                disabled={pending || (testoObbligatorio && !testo.trim())}
                onClick={conferma}
                className="btn-primary"
              >
                {pending ? "…" : "Conferma"}
              </button>
            </div>
          </div>
        )}

        {errore && (
          <p className="text-[15px] text-spesa" role="alert">
            {errore}
          </p>
        )}

        {owner && !modo && (
          <div className="flex flex-wrap gap-2">
            {f.stato === "da-verificare" && (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => esegui(() => segnaVerificato(f.id))}
                  className="btn-primary"
                >
                  Verificato
                </button>
                <button type="button" onClick={() => setModo("non-risolto")} className="btn-secondary">
                  Non risolto
                </button>
              </>
            )}
            {f.stato === "serve-info" && (
              <button type="button" onClick={() => setModo("rispondi")} className="btn-primary">
                Rispondi
              </button>
            )}
            {f.stato === "nuovo" && (
              <button
                type="button"
                onClick={() => {
                  setTesto(f.testo);
                  setModo("correggi");
                }}
                className="btn-secondary"
              >
                Modifica testo
              </button>
            )}
            {isNonChiuso(f.stato) && (
              <>
                <button type="button" onClick={() => setModo("nota")} className="btn-secondary">
                  Aggiungi nota
                </button>
                <button type="button" onClick={() => setModo("scarta")} className="btn-secondary text-spesa">
                  Scarta
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
