// Durata del countdown di preparazione pre-allenamento, ricordata per
// utente/dispositivo in localStorage. Letture/scritture avvolte in
// try/catch: privacy mode, quota piena o localStorage non disponibile non
// devono mai bloccare l'avvio della sessione, solo far ripiegare sul default.
//
// Esposto come mini "external store" (stesso pattern di lib/use-is-dark.ts
// per il tema) invece che con un useState + useEffect nel componente:
// leggere localStorage durante il render darebbe un valore diverso tra SSR
// (sempre il default) e la prima idratazione client, e impostarlo dentro un
// effetto è lo stesso setState-in-effect che il progetto evita altrove.
export const COUNTDOWN_SECONDS_OPTIONS = [30, 45, 60] as const;
export type CountdownSeconds = (typeof COUNTDOWN_SECONDS_OPTIONS)[number];
export const DEFAULT_COUNTDOWN_SECONDS: CountdownSeconds = 30;

const STORAGE_KEY = "radar.workout.countdownSeconds";

function isValidCountdownSeconds(value: number): value is CountdownSeconds {
  return (COUNTDOWN_SECONDS_OPTIONS as readonly number[]).includes(value);
}

function readFromStorage(): CountdownSeconds {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return isValidCountdownSeconds(parsed) ? parsed : DEFAULT_COUNTDOWN_SECONDS;
  } catch {
    return DEFAULT_COUNTDOWN_SECONDS;
  }
}

let cached: CountdownSeconds | null = null;
const listeners = new Set<() => void>();

export function getCountdownSecondsSnapshot(): CountdownSeconds {
  if (cached === null) cached = readFromStorage();
  return cached;
}

// Il server non conosce la preferenza (localStorage esiste solo lato
// client): il default combacia con quanto renderizzato in SSR.
export function getCountdownSecondsServerSnapshot(): CountdownSeconds {
  return DEFAULT_COUNTDOWN_SECONDS;
}

export function setCountdownSeconds(value: CountdownSeconds): void {
  cached = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Nessun impatto: la preferenza semplicemente non viene ricordata.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeCountdownSeconds(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
