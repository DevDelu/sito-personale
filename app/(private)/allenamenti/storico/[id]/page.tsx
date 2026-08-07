import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLogPerSessioneConNome, getSessione } from "@/lib/allenamento/queries";
import { SessionDetailEditor } from "@/components/allenamento/SessionDetailEditor";

export const metadata: Metadata = { title: "Allenamento · Dettaglio sessione" };

export default async function SessioneDettaglioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const sessione = await getSessione(id);
  if (!sessione) notFound();

  const log = await getLogPerSessioneConNome(id);

  return <SessionDetailEditor sessione={sessione} log={log} />;
}
