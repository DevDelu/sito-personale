// Sopra la tab bar c'è posto per un solo avviso. Chi occupa quella posizione lo
// segnala qui, così gli altri si spostano o aspettano:
// - avvisoFeedback: verifica o "Qualcosa non va?" (FeedbackProvider). TabBar non
//   mostra il suggerimento di scoperta, che ha la priorità più bassa.
// - toastAperto: la conferma di un'azione (ToastHost), che può avere "Annulla" e
//   va lasciata libera. Gli avvisi di feedback salgono sopra.
export function creaSegnale() {
  let attivo = false;
  const ascoltatori = new Set<() => void>();
  return {
    imposta(valore: boolean): void {
      if (valore === attivo) return;
      attivo = valore;
      ascoltatori.forEach((avvisa) => avvisa());
    },
    ascolta(avvisa: () => void): () => void {
      ascoltatori.add(avvisa);
      return () => {
        ascoltatori.delete(avvisa);
      };
    },
    leggi: (): boolean => attivo,
  };
}

export const avvisoFeedback = creaSegnale();
export const toastAperto = creaSegnale();
