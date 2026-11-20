"use client";

import { useState } from "react";

// Scarica il backup JSON. Su iPhone prova il foglio di condivisione (File/iCloud),
// altrimenti download normale.
export function BackupSettings() {
  const [stato, setStato] = useState<"idle" | "carico" | "ok" | "errore">("idle");

  async function scarica() {
    setStato("carico");
    try {
      const res = await fetch("/api/backup", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const nome = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "radar-backup.json";
      const file = new File([blob], nome, { type: "application/json" });
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          setStato("ok");
          return;
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") {
            setStato("idle");
            return;
          }
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nome;
      a.click();
      URL.revokeObjectURL(url);
      setStato("ok");
    } catch {
      setStato("errore");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={scarica}
        disabled={stato === "carico"}
        className="btn-secondary min-h-11 self-start px-4 text-[15px] disabled:opacity-60"
      >
        {stato === "carico" ? "Preparo il file…" : "Scarica backup"}
      </button>
      <p role="status" className="text-[13px] text-muted">
        {stato === "ok" && "Backup pronto."}
        {stato === "errore" && "Non sono riuscito a creare il backup. Riprova."}
      </p>
    </div>
  );
}
