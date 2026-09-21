import "server-only";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isOwner } from "@/lib/supabase/owner";

// lib/supabase/proxy.ts (middleware) chiama già supabase.auth.getUser() ad
// ogni richiesta protetta e propaga l'esito via header di richiesta: qui ci
// si fida di quell'header invece di rifare la stessa chiamata di rete a
// Supabase Auth, che prima raddoppiava la latenza di ogni navigazione
// nell'area privata (una volta nel middleware, una volta nel layout/route).
// Il fallback di rete resta per le rotte non coperte dal matcher del
// middleware (vedi proxy.ts in root).
export async function getUser() {
  const headerList = await headers();
  const verifiedId = headerList.get("x-verified-user-id");
  if (verifiedId) {
    return { id: verifiedId, email: headerList.get("x-verified-user-email") || null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// L'area privata è a singolo utente (Lorenzo). Il quiz pubblico in homepage
// introduce un secondo modo di autenticarsi (Google OAuth via Supabase Auth,
// aperto a chiunque): senza questo controllo, un giocatore qualsiasi che fa
// login con Google per il quiz otterrebbe una sessione Supabase valida e
// passerebbe anche il solo check "utente loggato" delle route private
// (spese, investimenti, carte, agenda, allenamenti).
export async function requireUser() {
  const user = await getUser();

  if (!user || !isOwner(user.email)) {
    redirect("/login");
  }

  return user;
}
