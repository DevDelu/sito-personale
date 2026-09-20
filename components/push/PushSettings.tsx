"use client";

import { useCallback, useEffect, useState } from "react";

type Stato =
  | "loading"
  | "non_supportato"
  | "ios_non_installata"
  | "server_non_configurato"
  | "permesso_negato"
  | "pronto";

// applicationServerKey vuole un Uint8Array, PushManager.subscribe() non
// accetta la chiave pubblica VAPID (base64url) come stringa.
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// Chiave pubblica VAPID: NEXT_PUBLIC_*, inlineata a build time. Se assente
// (VAPID non ancora configurato su Vercel, vedi CLAUDE.md) la sezione mostra
// "non configurato" invece di rompersi — nessun'altra pagina dipende da
// questo valore.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function rilevaStato(): Stato {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "non_supportato";
  if (isIos() && !isStandalone()) return "ios_non_installata";
  if (!VAPID_PUBLIC_KEY) return "server_non_configurato";
  if (Notification.permission === "denied") return "permesso_negato";
  return "pronto";
}

export function PushSettings() {
  const [stato, setStato] = useState<Stato>("loading");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messaggio, setMessaggio] = useState<string | null>(null);

  const aggiornaStatoSubscription = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {
      setSubscribed(false);
    }
  }, []);

  // Il rilevamento dipende da API solo-browser (navigator, matchMedia,
  // Notification): non calcolabile durante il render (SSR non le ha), va
  // dentro un effetto. La chiamata a setState è annidata in una funzione
  // async invece che diretta nel corpo dell'effetto, stesso pattern di
  // hooks/useWakeLock.ts, per non incorrere nel warning ESLint su setState
  // sincrono dentro un effetto.
  useEffect(() => {
    async function rileva() {
      const esito = rilevaStato();
      setStato(esito);
      if (esito === "pronto") await aggiornaStatoSubscription();
    }
    rileva();
  }, [aggiornaStatoSubscription]);

  // Il permesso va richiesto solo qui, dentro un click esplicito: Safari
  // (e in generale i browser) ignorano o bocciano richieste non partite da
  // un gesto utente diretto.
  async function attiva() {
    if (!VAPID_PUBLIC_KEY) return;
    setBusy(true);
    setMessaggio(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStato("permesso_negato");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      if (res.status === 503) {
        setStato("server_non_configurato");
        return;
      }
      if (!res.ok) throw new Error("Registrazione della subscription fallita.");

      setSubscribed(true);
      setMessaggio("Notifiche attivate su questo dispositivo.");
    } catch (error) {
      setMessaggio((error as Error).message || "Errore durante l'attivazione.");
    } finally {
      setBusy(false);
    }
  }

  async function disattiva() {
    setBusy(true);
    setMessaggio(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMessaggio("Notifiche disattivate su questo dispositivo.");
    } catch (error) {
      setMessaggio((error as Error).message || "Errore durante la disattivazione.");
    } finally {
      setBusy(false);
    }
  }

  async function invioProva() {
    setBusy(true);
    setMessaggio(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json().catch(() => null);

      if (res.status === 503) {
        setStato("server_non_configurato");
        return;
      }
      if (!res.ok || !data?.ok) {
        setMessaggio(`Invio non riuscito${data?.reason ? ` (${data.reason})` : ""}.`);
        return;
      }
      setMessaggio(`Notifica di prova inviata a ${data.sent} dispositivo/i.`);
    } catch {
      setMessaggio("Errore di rete durante l'invio.");
    } finally {
      setBusy(false);
    }
  }

  if (stato === "loading") return null;

  if (stato === "non_supportato") {
    return <p className="text-sm text-muted">Le notifiche push non sono supportate da questo browser.</p>;
  }

  if (stato === "ios_non_installata") {
    return (
      <p className="text-sm text-muted">
        Apri Radar in Safari → Condividi → Aggiungi a Home, poi riaprila da lì per attivare le notifiche.
      </p>
    );
  }

  if (stato === "server_non_configurato") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">Notifiche non ancora configurate sul server.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" disabled>
            Attiva notifiche
          </button>
          <button type="button" className="btn-secondary" disabled>
            Disattiva
          </button>
          <button type="button" className="btn-secondary" disabled>
            Invia notifica di prova
          </button>
        </div>
      </div>
    );
  }

  if (stato === "permesso_negato") {
    return (
      <p className="text-sm text-muted">
        Il permesso per le notifiche è stato negato. Riattivalo dalle impostazioni di sistema (su iPhone:
        Impostazioni → Radar → Notifiche) e ricarica questa pagina.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        {subscribed ? "Notifiche attive su questo dispositivo." : "Notifiche non ancora attivate su questo dispositivo."}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={busy || subscribed} onClick={attiva}>
          Attiva notifiche
        </button>
        <button type="button" className="btn-secondary" disabled={busy || !subscribed} onClick={disattiva}>
          Disattiva
        </button>
        <button type="button" className="btn-secondary" disabled={busy} onClick={invioProva}>
          Invia notifica di prova
        </button>
      </div>
      {messaggio && <p className="text-sm text-muted">{messaggio}</p>}
    </div>
  );
}
