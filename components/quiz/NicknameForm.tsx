"use client";

import { useState, type FormEvent } from "react";

// Riusato sia per l'ospite (nickname locale, richiesto a ogni partita, mai
// salvato) sia per Google (nickname persistito la prima volta): la
// differenza sta tutta in cosa fa `onSubmit`, passato dal chiamante.
export function NicknameForm({
  title,
  helper,
  onSubmit,
}: {
  title: string;
  helper?: string;
  onSubmit: (nickname: string) => Promise<string | null>;
}) {
  const [nickname, setNickname] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed.length < 2) {
      setError("Il nickname deve avere almeno 2 caratteri.");
      return;
    }
    setPending(true);
    setError(null);
    const errore = await onSubmit(trimmed);
    setPending(false);
    if (errore) setError(errore);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-4 text-center">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {helper && <p className="text-sm text-muted">{helper}</p>}
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Il tuo nickname"
        maxLength={24}
        autoFocus
        className="field-input w-full text-center"
      />
      {error && (
        <p className="text-sm text-spesa" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Un attimo..." : "Continua"}
      </button>
    </form>
  );
}
