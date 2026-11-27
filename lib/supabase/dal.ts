import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isOwner, isTester } from "@/lib/supabase/owner";

// L'identità si legge solo dalla sessione, verificata con Supabase Auth: mai
// da header o altri dati della richiesta. cache() evita di rifare la chiamata
// più volte nello stesso render (layout, pagina, query).
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// L'area privata è a singolo utente (Lorenzo). Il quiz pubblico in homepage
// introduce un secondo modo di autenticarsi (Google OAuth via Supabase Auth,
// aperto a chiunque): senza questo controllo, un giocatore qualsiasi che fa
// login con Google per il quiz otterrebbe una sessione Supabase valida e
// passerebbe anche il solo check "utente loggato" delle route private
// (spese, investimenti, carte, agenda, allenamenti).
//
// Il tester degli agenti notturni (TESTER_EMAIL) passa requireUser() per
// poter aprire le pagine, ma non requireWriter(): le Server Action e ogni
// scrittura usano requireWriter().
export async function requireUser() {
  const user = await getUser();

  if (!user || (!isOwner(user.email) && !isTester(user.email))) {
    redirect("/login");
  }

  return user;
}

// Solo owner: per Server Action e scritture. Doppia protezione rispetto al
// blocco delle richieste non-GET del tester in lib/supabase/proxy.ts.
export async function requireWriter() {
  const user = await getUser();

  if (!user || !isOwner(user.email)) {
    redirect("/login");
  }

  return user;
}
