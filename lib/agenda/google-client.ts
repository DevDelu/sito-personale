import "server-only";

// Wrapper minimale su fetch verso Google Calendar API v3 e Gmail API v1,
// niente SDK pesanti — stesso approccio di lib/investimenti/price-providers.ts
// che chiama le sue API esterne via fetch diretto.

export class GoogleReauthRequiredError extends Error {
  constructor() {
    super("Il collegamento con Google è scaduto: serve riconnettersi.");
    this.name = "GoogleReauthRequiredError";
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} non impostata: verifica le variabili d'ambiente (vedi supabase/017_agenda.sql e il setup Google descritto nel brief del modulo Agenda).`
    );
  }
  return value;
}

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

export type GoogleTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: requireEnv("GOOGLE_REDIRECT_URI"),
      grant_type: "authorization_code",
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Google OAuth: scambio del codice fallito (${json.error ?? res.status}).`);
  }
  return json as GoogleTokens;
}

// In modalità Testing (user type External) il refresh token scade dopo 7
// giorni: Google risponde error=invalid_grant. Va intercettato qui e
// rilanciato come errore tipizzato, così i chiamanti possono distinguerlo da
// un errore di rete/API generico e mostrare "Riconnetti Google" invece di
// far fallire la sync silenziosamente.
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    if (json.error === "invalid_grant") throw new GoogleReauthRequiredError();
    throw new Error(`Google OAuth: refresh del token fallito (${json.error ?? res.status}).`);
  }
  return json as GoogleTokens;
}

type GoogleEventTime = { date?: string; dateTime?: string; timeZone?: string };
type GoogleEvent = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: GoogleEventTime;
  end?: GoogleEventTime;
};

export type EventoPushInput = {
  google_event_id: string | null;
  titolo: string;
  descrizione: string | null;
  luogo: string | null;
  data_inizio: string;
  data_fine: string;
  tutto_il_giorno: boolean;
};

function toGoogleEventBody(evento: EventoPushInput) {
  const body: Record<string, unknown> = {
    summary: evento.titolo,
    description: evento.descrizione ?? undefined,
    location: evento.luogo ?? undefined,
  };
  if (evento.tutto_il_giorno) {
    body.start = { date: evento.data_inizio.slice(0, 10) };
    body.end = { date: evento.data_fine.slice(0, 10) };
  } else {
    body.start = { dateTime: evento.data_inizio };
    body.end = { dateTime: evento.data_fine };
  }
  return body;
}

// Insert se l'evento non ha ancora un google_event_id, update altrimenti.
// Ritorna l'id evento Google (nuovo o esistente) da salvare su
// `eventi.google_event_id`.
export async function pushEventToGoogle(evento: EventoPushInput, accessToken: string): Promise<string> {
  const body = toGoogleEventBody(evento);
  const url = evento.google_event_id ? `${CALENDAR_BASE}/${evento.google_event_id}` : CALENDAR_BASE;
  const method = evento.google_event_id ? "PATCH" : "POST";

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Google Calendar: push evento fallito (${json.error?.message ?? res.status}).`);
  return json.id as string;
}

export async function deleteEventFromGoogle(googleEventId: string, accessToken: string): Promise<void> {
  const res = await fetch(`${CALENDAR_BASE}/${googleEventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // 404/410 = già assente lato Google (cancellato altrove): non è un errore
  // da propagare, l'obiettivo (evento non più presente) è già raggiunto.
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Google Calendar: eliminazione evento fallita (HTTP ${res.status}).`);
  }
}

export type PulledGoogleEvent = {
  google_event_id: string;
  cancellato: boolean;
  titolo: string;
  descrizione: string | null;
  luogo: string | null;
  data_inizio: string;
  data_fine: string;
  tutto_il_giorno: boolean;
};

function fromGoogleEvent(ev: GoogleEvent): PulledGoogleEvent {
  const tuttoIlGiorno = Boolean(ev.start?.date);
  return {
    google_event_id: ev.id,
    cancellato: ev.status === "cancelled",
    titolo: ev.summary ?? "(senza titolo)",
    descrizione: ev.description ?? null,
    luogo: ev.location ?? null,
    data_inizio: tuttoIlGiorno ? `${ev.start?.date}T00:00:00.000Z` : (ev.start?.dateTime ?? new Date().toISOString()),
    data_fine: tuttoIlGiorno ? `${ev.end?.date}T00:00:00.000Z` : (ev.end?.dateTime ?? new Date().toISOString()),
    tutto_il_giorno: tuttoIlGiorno,
  };
}

export type PullResult = { eventi: PulledGoogleEvent[]; nextSyncToken: string | null; fullResyncRichiesto: boolean };

// Pull incrementale con syncToken se presente (altrimenti full sync
// sull'ultimo anno). Se Google risponde 410 il syncToken non è più valido:
// segnalato al chiamante con fullResyncRichiesto invece di lanciare
// un'eccezione, così la route di sync può ripetere la chiamata da capo.
export async function pullGoogleEvents(accessToken: string, syncToken?: string | null): Promise<PullResult> {
  const eventi: PulledGoogleEvent[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | null = null;

  do {
    const params = new URLSearchParams({ maxResults: "250", singleEvents: "true" });
    if (syncToken) params.set("syncToken", syncToken);
    else params.set("timeMin", new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString());
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${CALENDAR_BASE}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 410) {
      return { eventi: [], nextSyncToken: null, fullResyncRichiesto: true };
    }
    const json = await res.json();
    if (!res.ok) throw new Error(`Google Calendar: pull eventi fallito (${json.error?.message ?? res.status}).`);

    for (const ev of (json.items ?? []) as GoogleEvent[]) eventi.push(fromGoogleEvent(ev));
    pageToken = json.nextPageToken;
    if (json.nextSyncToken) nextSyncToken = json.nextSyncToken;
  } while (pageToken);

  return { eventi, nextSyncToken, fullResyncRichiesto: false };
}

function formatGmailDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function headerValue(headers: { name: string; value: string }[] | undefined, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

async function searchMessageIds(query: string, accessToken: string): Promise<string[]> {
  const res = await fetch(`${GMAIL_BASE}/messages?${new URLSearchParams({ q: query, maxResults: "25" })}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Gmail: ricerca messaggi fallita (${json.error?.message ?? res.status}).`);
  return ((json.messages ?? []) as { id: string }[]).map((m) => m.id);
}

async function fetchMessageMeta(id: string, accessToken: string) {
  const params = new URLSearchParams({ format: "metadata" });
  params.append("metadataHeaders", "From");
  params.append("metadataHeaders", "To");
  params.append("metadataHeaders", "Subject");
  params.append("metadataHeaders", "Date");
  const res = await fetch(`${GMAIL_BASE}/messages/${id}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Gmail: lettura messaggio fallita (${json.error?.message ?? res.status}).`);
  return json as { id: string; snippet?: string; payload?: { headers?: { name: string; value: string }[] } };
}

export type MailMessage = {
  id: string;
  da: string;
  a: string;
  oggetto: string;
  snippet: string;
  data: string;
};

// Due query separate (posta ricevuta / inviata) sulla singola data: solo
// intestazioni + snippet, mai il corpo completo del messaggio — coerente
// con lo scope di lettura minimo deciso per gmail.readonly. Non va mai
// persistito su Supabase (vedi app/api/agenda/mail/route.ts).
export async function fetchMailByDate(
  accessToken: string,
  data: string
): Promise<{ ricevute: MailMessage[]; inviate: MailMessage[] }> {
  const giorno = new Date(`${data}T00:00:00Z`);
  const domani = new Date(giorno.getTime() + 24 * 60 * 60 * 1000);
  const after = formatGmailDate(giorno);
  const before = formatGmailDate(domani);

  async function cerca(prefisso: string): Promise<MailMessage[]> {
    const ids = await searchMessageIds(`${prefisso} after:${after} before:${before}`, accessToken);
    const messaggi = await Promise.all(ids.map((id) => fetchMessageMeta(id, accessToken)));
    return messaggi.map((m) => ({
      id: m.id,
      da: headerValue(m.payload?.headers, "From"),
      a: headerValue(m.payload?.headers, "To"),
      oggetto: headerValue(m.payload?.headers, "Subject") || "(nessun oggetto)",
      snippet: m.snippet ?? "",
      data: headerValue(m.payload?.headers, "Date"),
    }));
  }

  const [ricevute, inviate] = await Promise.all([cerca("in:inbox"), cerca("in:sent")]);
  return { ricevute, inviate };
}
