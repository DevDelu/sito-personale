import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM: IV (12 byte) + auth tag (16 byte) + ciphertext, concatenati e
// codificati in base64 in un'unica stringa. Chiave da
// GOOGLE_TOKEN_ENCRYPTION_KEY (32 byte random in hex, generata a mano con
// `openssl rand -hex 32`, non da Claude Code). Mai loggare il token in
// chiaro, nemmeno nei messaggi di errore.
function getKey(): Buffer {
  const hex = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      "GOOGLE_TOKEN_ENCRYPTION_KEY non impostata: genera una chiave con `openssl rand -hex 32` e aggiungila a .env.local / Vercel."
    );
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error(
      "GOOGLE_TOKEN_ENCRYPTION_KEY non valida: deve essere una stringa hex di 32 byte (64 caratteri)."
    );
  }
  return key;
}

export function encryptToken(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptToken(enc: string): string {
  const key = getKey();
  const raw = Buffer.from(enc, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Impossibile decifrare il token Google: chiave di cifratura cambiata o dato corrotto.");
  }
}
