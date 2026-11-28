import Link from "next/link";

// Una scheda o una sessione che non esiste più resta dentro l'area privata
// (tab bar compresa), invece del 404 del sito pubblico.
// fb-aree: stato di errore senza sezioni proprie
export default function NonTrovatoAreaPrivata() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-[22px] font-semibold">Non trovato</h1>
      <p className="text-[15px] text-muted">Questo elemento non esiste o è stato eliminato.</p>
      <Link href="/altro" className="btn-primary inline-flex min-h-11 items-center">
        Vai al menu
      </Link>
    </div>
  );
}
