"use client";

import { startTransition, type FormEvent } from "react";

// React svuota un form dopo `action={...}`, anche quando il server risponde con
// un errore: chi aveva scritto un messaggio lo perdeva. Con onSubmit l'azione
// parte allo stesso modo e i campi restano. `action` resta sul form per chi non
// ha JavaScript.
export function inviaSenzaSvuotare(azione: (dati: FormData) => void) {
  return (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const dati = new FormData(evento.currentTarget);
    startTransition(() => azione(dati));
  };
}
