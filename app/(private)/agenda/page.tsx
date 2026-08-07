import type { Metadata } from "next";
import { getEventiRange, getIntegrazioneGoogle, getNoteRange } from "@/lib/agenda/queries";
import { AgendaBoard } from "@/components/agenda/AgendaBoard";
import { SyncStatusBadge } from "@/components/agenda/SyncStatusBadge";

export const metadata: Metadata = { title: "Agenda" };

// Mese corrente + una settimana di padding per lato, per coprire le celle
// del mese precedente/successivo visibili nella griglia del calendario.
function rangeVisibile(): { fromTimestamp: string; toTimestamp: string; fromData: string; toData: string } {
  const oggi = new Date();
  const inizio = new Date(Date.UTC(oggi.getUTCFullYear(), oggi.getUTCMonth(), 1));
  const fine = new Date(Date.UTC(oggi.getUTCFullYear(), oggi.getUTCMonth() + 1, 1));
  inizio.setUTCDate(inizio.getUTCDate() - 7);
  fine.setUTCDate(fine.getUTCDate() + 7);
  return {
    fromTimestamp: inizio.toISOString(),
    toTimestamp: fine.toISOString(),
    fromData: inizio.toISOString().slice(0, 10),
    toData: fine.toISOString().slice(0, 10),
  };
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ google_error?: string }>;
}) {
  const { google_error } = await searchParams;
  const { fromTimestamp, toTimestamp, fromData, toData } = rangeVisibile();

  const [eventi, integrazione, note] = await Promise.all([
    getEventiRange(fromTimestamp, toTimestamp),
    getIntegrazioneGoogle(),
    getNoteRange(fromData, toData),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Agenda</h1>
        <p className="text-sm text-muted">Calendario, note e posta per giorno.</p>
      </div>

      {google_error && (
        <p className="rounded-xl border border-spesa/30 bg-spesa/10 px-3 py-2 text-sm text-spesa" role="alert">
          Collegamento Google non riuscito ({google_error}). Riprova con &ldquo;Connetti Google&rdquo;.
        </p>
      )}

      <SyncStatusBadge integrazione={integrazione} />

      <AgendaBoard eventi={eventi} note={note} />
    </div>
  );
}
