"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Link2, RefreshCw } from "lucide-react";
import type { IntegrazioneGoogle } from "@/lib/agenda/types";

function formatUltimoSync(iso: string | null): string {
  if (!iso) return "mai";
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Sync solo on-demand (nessun webhook realtime, fuori scope per questa
// consegna): il pulsante "Sincronizza ora" è l'unico modo per far girare
// pull+push. In modalità Testing (user type External) il refresh token
// Google scade dopo 7 giorni: se la sync fallisce con reauth_required, va
// mostrato "Riconnetti Google" invece di fallire silenziosamente.
export function SyncStatusBadge({ integrazione }: { integrazione: IntegrazioneGoogle | null }) {
  const router = useRouter();
  const [sincronizzando, setSincronizzando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const stato = integrazione?.stato ?? "non_connesso";

  async function sincronizza() {
    setSincronizzando(true);
    setErrore(null);
    try {
      const res = await fetch("/api/agenda/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setErrore(json.error ?? "Sincronizzazione fallita.");
        return;
      }
      router.refresh();
    } catch {
      setErrore("Sincronizzazione fallita.");
    } finally {
      setSincronizzando(false);
    }
  }

  return (
    <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="flex items-center gap-2 text-sm">
        {stato === "connesso" && (
          <>
            <span className="h-2 w-2 rounded-full bg-entrata" />
            <span className="text-muted">
              Google collegato · ultima sync {formatUltimoSync(integrazione?.ultimo_sync ?? null)}
            </span>
          </>
        )}
        {stato === "scaduto" && (
          <>
            <AlertTriangle className="h-4 w-4 text-spesa" />
            <span className="text-spesa">Collegamento Google scaduto</span>
          </>
        )}
        {stato === "non_connesso" && (
          <>
            <span className="h-2 w-2 rounded-full bg-muted/50" />
            <span className="text-muted">Google non collegato</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {stato === "connesso" ? (
          <button
            type="button"
            onClick={sincronizza}
            disabled={sincronizzando}
            className="btn-secondary flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${sincronizzando ? "animate-spin" : ""}`} />
            {sincronizzando ? "Sincronizzazione..." : "Sincronizza ora"}
          </button>
        ) : (
          <Link href="/api/agenda/auth/google" className="btn-primary flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            {stato === "scaduto" ? "Riconnetti Google" : "Connetti Google"}
          </Link>
        )}
      </div>

      {errore && (
        <p className="w-full text-sm text-spesa" role="alert">
          {errore}
        </p>
      )}
    </div>
  );
}
