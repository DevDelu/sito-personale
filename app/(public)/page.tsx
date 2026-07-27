import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Delu</h1>
      <p className="max-w-md text-muted">
        Portfolio in arrivo. Per ora questo è solo l&apos;archivio personale.
      </p>
      <Link
        href="/login"
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        Area privata
      </Link>
    </main>
  );
}
