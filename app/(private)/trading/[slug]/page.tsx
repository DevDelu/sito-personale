import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContenutoLezione } from "@/components/trading/ContenutoLezione";
import { QuizLezione } from "@/components/trading/QuizLezione";
import { LEZIONI, LIVELLI, adiacenti, lezione } from "@/lib/trading/lezioni";

export function generateStaticParams() {
  return LEZIONI.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: lezione(slug)?.titolo ?? "Lezione" };
}

export default async function LezionePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = lezione(slug);
  if (!l) notFound();
  const { precedente, successiva } = adiacenti(slug);
  const numero = LEZIONI.indexOf(l) + 1;

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader title={l.titolo} parent={{ href: "/trading", label: "Corso" }} />

      <header className="flex flex-col gap-1">
        <Link href="/trading" className="hidden text-sm text-muted hover:text-foreground md:inline">
          ← Scuola di trading
        </Link>
        <span className="text-[13px] font-medium uppercase tracking-wide text-accent">
          Lezione {numero} · Livello {l.livello} {LIVELLI[l.livello].titolo} · {l.minuti} min
        </span>
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight">{l.titolo}</h1>
        <p className="text-[15px] text-muted">{l.sottotitolo}</p>
      </header>

      <div data-fb-area="trading.lezione.contenuto" className="contents">
        <ContenutoLezione blocchi={l.blocchi} />
      </div>

      <div data-fb-area="trading.lezione.quiz" className="contents">
        <section className="card flex flex-col gap-4 p-5">
          <h2 className="text-[22px] font-semibold">Verifica</h2>
          <QuizLezione key={l.slug} slug={l.slug} domande={l.quiz} />
        </section>
      </div>

      <nav className="grid grid-cols-2 gap-3" aria-label="Lezioni">
        {precedente ? (
          <Link href={`/trading/${precedente.slug}`} className="card flex min-h-14 items-center gap-2 p-3 text-[15px]">
            <ChevronLeft className="h-4 w-4 shrink-0 text-muted" />
            <span className="truncate">{precedente.titolo}</span>
          </Link>
        ) : (
          <span />
        )}
        {successiva ? (
          <Link href={`/trading/${successiva.slug}`} className="card flex min-h-14 items-center justify-end gap-2 p-3 text-right text-[15px]">
            <span className="truncate">{successiva.titolo}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
          </Link>
        ) : (
          <Link href="/trading/laboratorio" className="card flex min-h-14 items-center justify-end gap-2 p-3 text-right text-[15px]">
            <span className="truncate">Laboratorio</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
          </Link>
        )}
      </nav>
    </article>
  );
}
