// Sopra la tab bar c'è posto per un solo avviso. FeedbackProvider segnala qui
// quando mostra l'avviso di verifica o "Qualcosa non va?"; TabBar legge il
// valore e in quel caso non mostra il suggerimento di scoperta, che ha la
// priorità più bassa.
let occupato = false;
const ascoltatori = new Set<() => void>();

export function impostaAvvisoInBasso(valore: boolean): void {
  if (valore === occupato) return;
  occupato = valore;
  ascoltatori.forEach((avvisa) => avvisa());
}

export function ascoltaAvvisoInBasso(avvisa: () => void): () => void {
  ascoltatori.add(avvisa);
  return () => {
    ascoltatori.delete(avvisa);
  };
}

export function avvisoInBasso(): boolean {
  return occupato;
}
