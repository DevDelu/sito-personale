import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/dal";
import { isOwner } from "@/lib/supabase/owner";
import { PageHeader } from "@/components/ui/PageHeader";
import { FeedbackElenco } from "@/components/feedback/FeedbackElenco";
import { FeedbackRiepilogo } from "@/components/feedback/FeedbackRiepilogo";
import { eventiChiusura, isTabellaMancante, listaFeedback } from "@/lib/feedback/queries";
import { calcolaRiepilogo } from "@/lib/feedback/riepilogo";
import type { FeedbackRow } from "@/lib/feedback/types";

export const metadata: Metadata = { title: "Feedback" };

// Dove Lorenzo ritrova i suoi feedback: stato sempre visibile, dettaglio con
// timeline e azioni (verifica, risposta, note, scarto). Raggiungibile da
// /altro (mobile) e dalla sidebar desktop.
export default async function FeedbackPage() {
  const user = await requireUser();

  let righe: FeedbackRow[] = [];
  let verifiche: Awaited<ReturnType<typeof eventiChiusura>> = [];
  let nonConfigurato = false;
  try {
    [righe, verifiche] = await Promise.all([listaFeedback(), eventiChiusura()]);
  } catch (error) {
    // Migration 033 non ancora applicata (tabella eventi o colonne nuove
    // assenti): la pagina resta aperta con un avviso invece di rompersi.
    const e = error as { code?: string; message?: string };
    if (isTabellaMancante(e) || e.code === "42703" || e.code === "PGRST204") nonConfigurato = true;
    else throw error;
  }

  const riepilogo = calcolaRiepilogo(righe, verifiche);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Feedback" />

      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">I miei feedback</h1>
        <p className="text-sm text-muted">Cosa hai scritto, a che punto è e cosa aspetta te: una risposta, una PR da approvare o una verifica.</p>
      </div>

      {nonConfigurato ? (
        <p data-fb-area="feedback.lista" className="card p-4 text-[15px] text-muted">
          Feedback non ancora configurato: manca la migration <code>033_feedback_ciclo.sql</code>.
        </p>
      ) : (
        <>
          <div data-fb-area="feedback.lista" className="contents">
            <FeedbackElenco righe={righe} owner={isOwner(user.email)} />
          </div>
          <div data-fb-area="feedback.riepilogo" className="contents">
            <FeedbackRiepilogo riepilogo={riepilogo} />
          </div>
        </>
      )}
    </div>
  );
}
