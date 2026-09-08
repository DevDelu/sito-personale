import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isOwner } from "@/lib/supabase/owner";

export async function getUser() {
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
