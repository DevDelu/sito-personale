import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { aggiornaTemplate, eliminaTemplate } from "@/lib/alimentazione/template";
import type { ComposizioneItem } from "@/lib/alimentazione/types";

function parseComposizione(raw: unknown): ComposizioneItem[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ComposizioneItem[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") return null;
    const alimentoId = (r as Record<string, unknown>).alimento_id;
    const quantitaG = Number((r as Record<string, unknown>).quantita_g);
    if (typeof alimentoId !== "string" || !alimentoId) return null;
    if (!Number.isFinite(quantitaG) || quantitaG <= 0) return null;
    out.push({ alimento_id: alimentoId, quantita_g: quantitaG });
  }
  return out;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corpo della richiesta non valido." }, { status: 400 });
  }

  const patch: { nome?: string; composizione?: ComposizioneItem[]; note?: string | null } = {};

  if (typeof body.nome === "string") {
    const nome = body.nome.trim();
    if (!nome) return NextResponse.json({ error: "Il nome del template è obbligatorio." }, { status: 400 });
    patch.nome = nome;
  }
  if (body.composizione !== undefined) {
    const composizione = parseComposizione(body.composizione);
    if (composizione === null) {
      return NextResponse.json({ error: "Composizione non valida." }, { status: 400 });
    }
    patch.composizione = composizione;
  }
  if ("note" in body) patch.note = typeof body.note === "string" ? body.note.trim() || null : null;

  try {
    await aggiornaTemplate(id, patch);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { id } = await params;
  try {
    await eliminaTemplate(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
