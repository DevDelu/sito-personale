"use client";

// Sblocco dell'audio per la conversazione a voce. iOS concede AudioContext
// "running" e sintesi vocale solo se partono dentro un gesto dell'utente:
// il pulsante centrale della tab bar e l'invito "Qualcosa non va?" chiamano
// sbloccaAudio() nel loro onClick, prima di aprire lo sheet; il motore
// (hooks/useConversazioneVocale.ts) riusa poi lo stesso contesto. Senza,
// il microfono sentirebbe solo silenzio e l'ascolto non partirebbe mai.

let contesto: AudioContext | null = null;

export function sbloccaAudio(): AudioContext | null {
  try {
    contesto ??= new AudioContext();
    if (contesto.state === "suspended") void contesto.resume();
  } catch {
    contesto = null;
  }
  try {
    if ("speechSynthesis" in window) {
      const vuota = new SpeechSynthesisUtterance(" ");
      vuota.volume = 0;
      window.speechSynthesis.speak(vuota);
    }
  } catch {
    // Sintesi non disponibile: si risponderà solo per iscritto.
  }
  return contesto;
}

export function contestoAudio(): AudioContext | null {
  return contesto;
}
