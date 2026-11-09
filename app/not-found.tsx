import Link from "next/link";

// 404 con il tema del sito (la schermata predefinita di Next è bianca/nera e in
// inglese). Sta nel layout radice, quindi non usa next-intl: testo bilingue fisso.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-[15px] text-muted">404</p>
      <h1 className="text-[22px] font-semibold">Pagina non trovata</h1>
      <p className="text-[15px] text-muted">
        Il link non esiste più o è scritto male. <span lang="en">Page not found.</span>
      </p>
      <Link href="/" className="btn-primary min-h-11">
        Torna alla home
      </Link>
    </main>
  );
}
