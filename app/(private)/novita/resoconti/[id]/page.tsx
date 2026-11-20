import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Markdown } from "@/components/novita/Markdown";
import { getResoconto } from "@/lib/novita/queries";
import { leggiMarkdown } from "@/lib/novita/markdown";
import { etichettaGiorno, giornoRoma, oraRoma } from "@/lib/novita/date";

export const metadata: Metadata = { title: "Resoconto" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ResocontoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const r = await getResoconto(id);
  if (!r) notFound();
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Resoconto" parent={{ href: "/novita/resoconti", label: "Resoconti" }} />
      <div data-fb-area="novita.resoconto" className="contents">
        <article className="card flex flex-col gap-4 p-5" data-fb-entita={`resoconto:${r.id}`}>
          <header className="flex flex-col gap-1">
            <p className="text-[13px] text-muted">
              {etichettaGiorno(giornoRoma(r.created_at))} · {oraRoma(r.created_at)} · {r.turno}
            </p>
            <h2 className="text-[22px] font-bold tracking-tight">{r.titolo}</h2>
          </header>
          <Markdown blocchi={leggiMarkdown(r.testo)} />
        </article>
      </div>
    </div>
  );
}
