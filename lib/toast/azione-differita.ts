// Azioni "annullabili": l'effetto vero (es. la cancellazione) parte solo dopo un
// ritardo, durante il quale il toast offre "Annulla". Nessun inserimento
// di ritorno: se si annulla, semplicemente non succede nulla.

export const RITARDO_ANNULLA_MS = 5000;

type Timers = {
  set: (fn: () => void, ms: number) => unknown;
  clear: (h: unknown) => void;
};

type Voce = { handle: unknown; esegui: () => void };

export function creaAzioniDifferite(
  ritardoMs: number = RITARDO_ANNULLA_MS,
  timers: Timers = {
    set: (fn, ms) => setTimeout(fn, ms),
    clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
  }
) {
  const voci = new Map<string, Voce>();

  function parti(id: string) {
    const v = voci.get(id);
    if (!v) return false;
    voci.delete(id);
    timers.clear(v.handle);
    v.esegui();
    return true;
  }

  return {
    pianifica(id: string, esegui: () => void) {
      parti(id);
      const handle = timers.set(() => {
        if (voci.delete(id)) esegui();
      }, ritardoMs);
      voci.set(id, { handle, esegui });
    },
    annulla(id: string): boolean {
      const v = voci.get(id);
      if (!v) return false;
      voci.delete(id);
      timers.clear(v.handle);
      return true;
    },
    // Uscita dalla pagina: l'utente aveva confermato, quindi le azioni in
    // attesa vengono eseguite subito invece di andare perse.
    eseguiTutte() {
      for (const id of [...voci.keys()]) parti(id);
    },
    inAttesa: () => voci.size,
  };
}
