import { CircleHelp } from "lucide-react";
import { linkTutorialEsercizio } from "@/lib/allenamento/youtube";

export function TutorialLink({ esercizioNome }: { esercizioNome: string }) {
  return (
    <a
      href={linkTutorialEsercizio(esercizioNome)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-1 text-xs text-muted md:min-h-0 underline decoration-dotted underline-offset-2 transition-colors hover:text-accent"
    >
      <CircleHelp className="h-3 w-3" />
      Non ti ricordi come si fa?
    </a>
  );
}
