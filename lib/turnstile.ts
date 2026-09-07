import "server-only";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Verifica lato server il token generato dal widget Turnstile nel browser.
// Va sempre richiamata prima di considerare valido un invio: il solo
// controllo lato client è aggirabile da un bot che parli direttamente con
// la Server Action senza passare dal form.
export async function verifyTurnstileToken(token: string, remoteIp: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("Turnstile: TURNSTILE_SECRET_KEY non impostata, verifica saltata.");
    // Fail-open solo se la chiave non è configurata (es. locale senza .env
    // completo) — in produzione va sempre impostata, lì non si attiva mai.
    return process.env.NODE_ENV !== "production";
  }

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: remoteIp }),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch (e) {
    console.error("Turnstile: verifica fallita per errore di rete.", e);
    return false;
  }
}
