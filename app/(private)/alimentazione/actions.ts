"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/dal";
import { creaPasto, registraPeso, salvaProfilo } from "@/lib/alimentazione/queries";
import { registraPastoDaTemplate as registraPastoDaTemplateQuery } from "@/lib/alimentazione/template";
import type { ComposizioneItem, FaseObiettivo, LivelloAttivita, TipoPasto } from "@/lib/alimentazione/types";

const TIPI_PASTO: TipoPasto[] = ["colazione", "pranzo", "cena", "spuntino"];

export type AggiungiPastoState = { error?: string } | undefined;

export async function aggiungiPasto(
  _prevState: AggiungiPastoState,
  formData: FormData
): Promise<AggiungiPastoState> {
  await requireUser();

  const tipoPastoRaw = String(formData.get("tipo_pasto") ?? "");
  const alimentoId = String(formData.get("alimento_id") ?? "").trim();
  const data = String(formData.get("data") ?? "").trim();
  const quantitaG = Number(String(formData.get("quantita_g") ?? "").replace(",", "."));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!TIPI_PASTO.includes(tipoPastoRaw as TipoPasto)) return { error: "Seleziona un tipo pasto valido." };
  if (!alimentoId) return { error: "Seleziona o crea un alimento." };
  if (!data) return { error: "La data è obbligatoria." };
  if (!Number.isFinite(quantitaG) || quantitaG <= 0) {
    return { error: "La quantità deve essere un numero positivo." };
  }

  try {
    await creaPasto({ data, tipoPasto: tipoPastoRaw as TipoPasto, alimentoId, quantitaG, note });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath("/alimentazione");
  redirect("/alimentazione?added=1");
}

export type RegistraPastoDaTemplateState = { error?: string } | undefined;

// Registra in un colpo solo un pasto reale per ogni voce della composizione
// del template del giorno (loop su creaPasto in
// lib/alimentazione/template.ts): il quick-add continua a funzionare
// invariato per giorni/pasti senza template o per loggare qualcosa fuori
// piano, questa è solo un'alternativa più veloce quando il template combacia.
export async function registraPastoDaTemplate(
  _prevState: RegistraPastoDaTemplateState,
  formData: FormData
): Promise<RegistraPastoDaTemplateState> {
  await requireUser();

  const tipoPastoRaw = String(formData.get("tipo_pasto") ?? "");
  const data = String(formData.get("data") ?? "").trim();
  const composizioneRaw = String(formData.get("composizione") ?? "");

  if (!TIPI_PASTO.includes(tipoPastoRaw as TipoPasto)) return { error: "Seleziona un tipo pasto valido." };
  if (!data) return { error: "La data è obbligatoria." };

  let composizione: ComposizioneItem[];
  try {
    const parsed = JSON.parse(composizioneRaw);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error();
    composizione = parsed.map((r) => {
      const alimentoId = String(r.alimento_id ?? "");
      const quantitaG = Number(r.quantita_g);
      if (!alimentoId || !Number.isFinite(quantitaG) || quantitaG <= 0) throw new Error();
      return { alimento_id: alimentoId, quantita_g: quantitaG };
    });
  } catch {
    return { error: "Composizione del template non valida." };
  }

  try {
    await registraPastoDaTemplateQuery({ data, tipoPasto: tipoPastoRaw as TipoPasto, composizione });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath("/alimentazione");
  redirect("/alimentazione?added=1");
}

export type SalvaProfiloState = { error?: string } | undefined;

export async function aggiornaProfilo(
  _prevState: SalvaProfiloState,
  formData: FormData
): Promise<SalvaProfiloState> {
  await requireUser();

  const altezzaCm = Number(formData.get("altezza_cm"));
  const eta = Number(formData.get("eta"));
  const sesso = String(formData.get("sesso") ?? "");
  const livelloAttivita = String(formData.get("livello_attivita") ?? "");
  const faseObiettivo = String(formData.get("fase_obiettivo") ?? "");
  const percentualeFase = Number(formData.get("percentuale_fase") ?? 0);

  if (!Number.isFinite(altezzaCm) || altezzaCm <= 0) return { error: "Altezza non valida." };
  if (!Number.isFinite(eta) || eta <= 0) return { error: "Età non valida." };
  if (sesso !== "M" && sesso !== "F") return { error: "Seleziona il sesso." };
  const livelli: LivelloAttivita[] = ["sedentario", "leggero", "moderato", "attivo", "molto_attivo"];
  if (!livelli.includes(livelloAttivita as LivelloAttivita)) return { error: "Livello di attività non valido." };
  const fasi: FaseObiettivo[] = ["mantenimento", "surplus", "deficit"];
  if (!fasi.includes(faseObiettivo as FaseObiettivo)) return { error: "Fase obiettivo non valida." };
  if (!Number.isFinite(percentualeFase) || percentualeFase < 0 || percentualeFase > 100) {
    return { error: "La percentuale di fase deve essere tra 0 e 100." };
  }

  try {
    await salvaProfilo({
      altezzaCm,
      eta,
      sesso,
      livelloAttivita: livelloAttivita as LivelloAttivita,
      faseObiettivo: faseObiettivo as FaseObiettivo,
      percentualeFase,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath("/alimentazione");
  revalidatePath("/alimentazione/profilo");
  redirect("/alimentazione/profilo?saved=1");
}

export type RegistraPesoState = { error?: string } | undefined;

export async function aggiungiPeso(
  _prevState: RegistraPesoState,
  formData: FormData
): Promise<RegistraPesoState> {
  await requireUser();

  const data = String(formData.get("data") ?? "").trim();
  const pesoKg = Number(String(formData.get("peso_kg") ?? "").replace(",", "."));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!data) return { error: "La data è obbligatoria." };
  if (!Number.isFinite(pesoKg) || pesoKg <= 0) return { error: "Il peso deve essere un numero positivo." };

  try {
    await registraPeso({ data, pesoKg, note });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath("/alimentazione");
  revalidatePath("/alimentazione/profilo");
  redirect("/alimentazione/profilo?peso_added=1");
}
