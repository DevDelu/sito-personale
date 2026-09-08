import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { SectionEyebrow } from "@/components/home/section-eyebrow";
import { LeaderboardPreview } from "./LeaderboardPreview";
import { QuizLauncher } from "./QuizLauncher";
import { QuizSectionReveal } from "./QuizSectionReveal";

// Teaser sempre presente lato server, leggero (nessun timer/stato di gioco):
// solo testo statico + top 5 della classifica. Il motore di gioco vero e
// proprio si monta solo al click di una CTA, vedi QuizLauncher.
//
// A differenza delle altre sezioni (testo su sfondo piatto), qui il
// contenuto vive dentro una card con bordo/bagliore accent: deve leggersi
// come un invito a interrompere la lettura e giocare, non come un altro
// paragrafo da scorrere.
export function QuizSection() {
  return (
    <section id="quiz" className="relative mx-auto w-full max-w-5xl overflow-hidden px-6 py-16">
      <div
        className="pointer-events-none absolute -right-16 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl"
        aria-hidden="true"
      />
      <QuizSectionReveal>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-10">
          <div className="flex flex-1 flex-col gap-4">
            <SectionEyebrow>prima di continuare a leggere</SectionEyebrow>
            <h2 className="flex items-center gap-2.5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              <Sparkles className="h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
              Quanto ne sai davvero di AI?
            </h2>
            <p className="max-w-md text-base leading-relaxed text-muted">
              5 domande veloci, 15 secondi a domanda. Gioca come ospite oppure accedi con Google per entrare nella
              classifica generale.
            </p>
            <QuizLauncher />
          </div>

          <div className="w-full shrink-0 sm:w-72">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted">Top 5</span>
            <Suspense fallback={<div className="h-40 animate-pulse rounded-xl border border-border bg-background" />}>
              <LeaderboardPreview />
            </Suspense>
          </div>
        </div>
      </QuizSectionReveal>
    </section>
  );
}
