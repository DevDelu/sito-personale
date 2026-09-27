// Confronto centralizzato "è il proprietario dell'app" (Lorenzo), usato sia
// da dal.ts (Server Component/Action) sia da proxy.ts (middleware, edge
// runtime): nessun import "server-only" qui, solo una funzione pura.
export function isOwner(email: string | null | undefined) {
  const ownerEmail = process.env.OWNER_EMAIL;
  return !!ownerEmail && !!email && email.toLowerCase() === ownerEmail.toLowerCase();
}

// Utente tester degli agenti notturni (TESTER_EMAIL): può APRIRE tutte le
// pagine private e leggere le API, mai scrivere. Il blocco delle scritture è
// centralizzato in lib/supabase/proxy.ts (ogni richiesta non GET/HEAD del
// tester viene rifiutata, Server Action comprese) e ripetuto in
// requireWriter() (dal.ts). Se TESTER_EMAIL manca o coincide con
// OWNER_EMAIL, nessuno è tester.
export function isTester(email: string | null | undefined) {
  const testerEmail = process.env.TESTER_EMAIL;
  if (!testerEmail || !email || isOwner(testerEmail)) return false;
  return email.toLowerCase() === testerEmail.toLowerCase();
}
