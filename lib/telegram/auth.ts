import { timingSafeEqual } from "node:crypto";

// Header che Telegram allega a ogni chiamata del webhook quando il webhook è
// registrato con `secret_token` (scripts/telegram-setup.mjs).
export const HEADER_SEGRETO = "x-telegram-bot-api-secret-token";

// Fail-closed: senza TELEGRAM_WEBHOOK_SECRET nessuna richiesta passa.
export function segretoValido(ricevuto: string | null | undefined, atteso: string | undefined): boolean {
  if (!atteso || !ricevuto) return false;
  const a = Buffer.from(atteso);
  const r = Buffer.from(ricevuto);
  return a.length === r.length && timingSafeEqual(a, r);
}

// Il bot è privato: risponde solo all'account Telegram di Lorenzo.
export function utenteAutorizzato(fromId: number | undefined, ownerId: string | undefined): boolean {
  if (!ownerId || fromId === undefined) return false;
  return String(fromId) === ownerId.trim();
}

export type AzioneBozza = { azione: "conferma" | "annulla"; bozzaId: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// callback_data dei bottoni inline (max 64 byte): "ok:<uuid>" / "no:<uuid>".
export function datiBottone(azione: AzioneBozza["azione"], bozzaId: string): string {
  return `${azione === "conferma" ? "ok" : "no"}:${bozzaId}`;
}

export function leggiBottone(data: string | undefined): AzioneBozza | null {
  if (!data) return null;
  const [prefisso, id] = data.split(":");
  if (!id || !UUID.test(id)) return null;
  if (prefisso === "ok") return { azione: "conferma", bozzaId: id };
  if (prefisso === "no") return { azione: "annulla", bozzaId: id };
  return null;
}
