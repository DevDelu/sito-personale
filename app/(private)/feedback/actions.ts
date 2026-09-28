"use server";

import { revalidatePath } from "next/cache";
import { requireWriter } from "@/lib/supabase/dal";
import { aggiungiEvento, cambiaStato, modificaTesto } from "@/lib/feedback/queries";
import { isUuid } from "@/lib/feedback/validazione";
import { EVENTO_TESTO_MAX, FEEDBACK_TESTO_MAX } from "@/lib/feedback/types";

// Azioni di Lorenzo sui propri feedback (pagina /feedback e avviso di
// verifica). Solo owner (requireWriter); ogni cambio di stato passa dalla
// matrice di lib/feedback/stati.ts dentro cambiaStato().

export type EsitoAzione = { ok: true } | { ok: false; errore: string };

function pulito(testo: string | null | undefined, max = EVENTO_TESTO_MAX): string | null {
  const t = (testo ?? "").trim();
  return t ? t.slice(0, max) : null;
}

async function transizione(
  id: string,
  a: "verificato" | "riaperto" | "scartato" | "preso-in-carico",
  testo: string | null,
  tipoEvento: "cambio-stato" | "risposta" = "cambio-stato"
): Promise<EsitoAzione> {
  await requireWriter();
  if (!isUuid(id)) return { ok: false, errore: "Feedback non valido." };
  const esito = await cambiaStato({ id }, a, "lorenzo", { testo, tipoEvento });
  if (!esito.ok) return { ok: false, errore: esito.messaggio };
  revalidatePath("/feedback");
  return { ok: true };
}

// "Sì, è sistemato".
export async function segnaVerificato(id: string) {
  return transizione(id, "verificato", null);
}

// "No, non è sistemato": torna in coda con priorità massima. Il "cosa non va
// ancora" arriva dopo, come nota (sheet), ed è facoltativo.
export async function segnaNonRisolto(id: string, testo?: string) {
  return transizione(id, "riaperto", pulito(testo));
}

export async function scarta(id: string, motivo?: string) {
  return transizione(id, "scartato", pulito(motivo));
}

// Risposta alla domanda dell'agente (serve-info → preso-in-carico). Il job
// notturno la riporta nella issue, parafrasata.
export async function rispondi(id: string, testo: string) {
  const t = pulito(testo);
  if (!t) return { ok: false, errore: "Scrivi una risposta." } satisfies EsitoAzione;
  return transizione(id, "preso-in-carico", t, "risposta");
}

export async function aggiungiNota(id: string, testo: string): Promise<EsitoAzione> {
  await requireWriter();
  const t = pulito(testo);
  if (!isUuid(id) || !t) return { ok: false, errore: "Nota vuota." };
  await aggiungiEvento({ feedback_id: id, autore: "lorenzo", tipo: "nota", testo: t });
  revalidatePath("/feedback");
  return { ok: true };
}

// Solo finché è `nuovo`: dopo, l'agente l'ha già letto e trasformato in issue.
export async function correggiTesto(id: string, testo: string): Promise<EsitoAzione> {
  await requireWriter();
  const t = pulito(testo, FEEDBACK_TESTO_MAX);
  if (!isUuid(id) || !t) return { ok: false, errore: "Testo vuoto." };
  if (!(await modificaTesto(id, t))) return { ok: false, errore: "Si può modificare solo finché è appena inviato." };
  revalidatePath("/feedback");
  return { ok: true };
}
