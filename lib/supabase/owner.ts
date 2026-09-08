// Confronto centralizzato "è il proprietario dell'app" (Lorenzo), usato sia
// da dal.ts (Server Component/Action) sia da proxy.ts (middleware, edge
// runtime): nessun import "server-only" qui, solo una funzione pura.
export function isOwner(email: string | null | undefined) {
  const ownerEmail = process.env.OWNER_EMAIL;
  return !!ownerEmail && !!email && email.toLowerCase() === ownerEmail.toLowerCase();
}
