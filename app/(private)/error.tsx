"use client";

// Rete di sicurezza dell'area privata: se una pagina lancia un errore durante
// il render (query Supabase fallita, dati inattesi) l'utente vede questo invece
// della schermata generica di Next, senza perdere tab bar e layout. Non mostra
// il messaggio dell'errore (potrebbe contenere dati): solo il codice `digest`
// per ritrovarlo nei log.
export default function ErroreAreaPrivata({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center"
    >
      <h1 className="text-[22px] font-semibold">Qualcosa non ha funzionato</h1>
      <p className="text-[15px] text-muted">
        La pagina non si è caricata. Riprova: di solito basta un secondo tentativo.
      </p>
      <button type="button" onClick={reset} className="btn-primary min-h-11">
        Riprova
      </button>
      {error.digest ? (
        <p className="text-[13px] text-muted">Codice: {error.digest}</p>
      ) : null}
    </div>
  );
}
