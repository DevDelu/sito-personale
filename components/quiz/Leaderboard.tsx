import type { LeaderboardRow } from "@/lib/quiz/types";

function formatTempo(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Lista righe (rank, nickname, punteggio, tempo), usata sia dal teaser
// server-side (top 5) sia dalla classifica completa dentro il gioco: nessun
// hook qui dentro, componente puramente presentazionale.
export function Leaderboard({ rows, ownNickname }: { rows: LeaderboardRow[]; ownNickname?: string | null }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">Nessun punteggio salvato ancora. Sii il primo a giocare.</p>;
  }

  return (
    <ol className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border">
      {rows.map((row) => {
        const isOwn = ownNickname != null && row.nickname === ownNickname;
        return (
          <li
            key={row.rank}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm ${isOwn ? "bg-accent/10" : "bg-surface"}`}
          >
            <span className="font-figures w-6 shrink-0 text-right text-muted">{row.rank}</span>
            <span className={`flex-1 truncate font-medium ${isOwn ? "text-accent" : ""}`}>{row.nickname}</span>
            <span className="font-figures text-muted">{formatTempo(row.time_taken_ms)}</span>
            <span className="font-figures w-10 shrink-0 text-right font-semibold">{row.score}/5</span>
          </li>
        );
      })}
    </ol>
  );
}
