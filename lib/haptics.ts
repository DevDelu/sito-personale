// Tocco aptico leggero per le conferme. Va chiamato SOLO dentro un gesto
// dell'utente (click, touchend): iOS ignora il trucco fuori da un gesto.
// Dove navigator.vibrate esiste (Android) si usa quello; su iPhone Safari si
// clicca un <input type="checkbox" switch> nascosto, che dà il tick di sistema.
// Hack non standard: se smette di funzionare degrada in silenzio.

const CHIAVE_OFF = "vibrazione";

type Ambiente = {
  vibrate?: (ms: number) => boolean;
  riduciMovimento: boolean;
  disattivata: boolean;
  tickSwitch: () => void;
};

export function eseguiTocco(env: Ambiente): boolean {
  if (env.riduciMovimento || env.disattivata) return false;
  try {
    if (env.vibrate) {
      env.vibrate(10);
      return true;
    }
    env.tickSwitch();
    return true;
  } catch {
    return false;
  }
}

let etichetta: HTMLLabelElement | null = null;

function tickSwitch() {
  if (!etichetta) {
    const label = document.createElement("label");
    label.setAttribute("aria-hidden", "true");
    label.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    input.tabIndex = -1;
    label.appendChild(input);
    document.body.appendChild(label);
    etichetta = label;
  }
  etichetta.click();
}

export function tocca(): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  let disattivata = false;
  try {
    disattivata = window.localStorage.getItem(CHIAVE_OFF) === "off";
  } catch {
    // storage non disponibile: resta attiva
  }
  return eseguiTocco({
    vibrate: typeof navigator !== "undefined" && "vibrate" in navigator ? (ms) => navigator.vibrate(ms) : undefined,
    riduciMovimento: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    disattivata,
    tickSwitch,
  });
}
