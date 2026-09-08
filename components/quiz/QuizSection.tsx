import { Suspense } from "react";
import { SectionEyebrow } from "@/components/home/section-eyebrow";
import { LeaderboardPreview } from "./LeaderboardPreview";
import { QuizLauncher } from "./QuizLauncher";

// Teaser sempre presente lato server, leggero (nessun timer/stato di gioco):
// solo testo statico + top 5 della classifica. Il motore di gioco vero e
// proprio si monta solo al click di una CTA, vedi QuizLauncher.
export function QuizSection() {
  return (
    <section id="quiz" className="mx-auto w-full max-w-5xl border-t border-border px-6 py-16">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-10">
        <div className="flex flex-1 flex-col gap-4">
          <SectionEyebrow>prima-di-continuare</SectionEyebrow>
          <h2 className="font-sans text-2xl font-bold tracking-tight">Metti alla prova quello che sai sull&apos;AI</h2>
          <p className="max-w-md text-base leading-relaxed text-muted">
            5 domande veloci, 15 secondi a domanda. Gioca come ospite oppure accedi con Google per entrare nella
            classifica generale.
          </p>
          <QuizLauncher />
        </div>

        <div className="w-full shrink-0 sm:w-72">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted">Top 5</span>
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />}>
            <LeaderboardPreview />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
