import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";
import type { ResocontoRiga } from "@/lib/novita/queries";
import { etichettaGiorno, giornoRoma, oraRoma } from "@/lib/novita/date";

export function ResocontiElenco({ resoconti }: { resoconti: Omit<ResocontoRiga, "testo">[] }) {
  if (resoconti.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-8 text-center">
        <ClipboardList className="h-6 w-6 text-accent" aria-hidden />
        <p className="text-[17px] font-semibold">Nessun resoconto ancora</p>
        <p className="max-w-sm text-[15px] text-muted">
          A fine di ogni turno il team di agenti ti lascia qui cosa ha fatto e cosa aspetta te, con una notifica.
        </p>
      </div>
    );
  }
  return (
    <ul className="card divide-y divide-[var(--app-hairline)] overflow-hidden">
      {resoconti.map((r) => (
        <li key={r.id}>
          <Link
            href={`/novita/resoconti/${r.id}`}
            className="flex min-h-11 items-center gap-3 px-4 py-3 active:bg-surface-hover"
            data-fb-entita={`resoconto:${r.id}`}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-[13px] text-muted">
                {etichettaGiorno(giornoRoma(r.created_at))} · {oraRoma(r.created_at)} · {r.turno}
              </p>
              <p className="truncate text-[17px] font-medium">{r.titolo}</p>
            </div>
            {r.azioni_per_te > 0 ? (
              <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-[13px] font-semibold text-accent-foreground">
                {r.azioni_per_te} per te
              </span>
            ) : null}
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
