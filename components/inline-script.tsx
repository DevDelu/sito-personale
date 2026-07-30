// Uno <script> reso via JSX viene eseguito dal browser solo al parsing
// dell'HTML iniziale: su una navigazione client-side React lo re-incontra
// senza eseguirlo e avvisa in console. Impostare type="text/plain" lato
// client lo rende inerte per React (nessun avviso), mentre lato server resta
// text/javascript così il browser lo esegue comunque al primo caricamento.
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
