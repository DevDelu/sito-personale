import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client anon SENZA cookie, per letture pubbliche (es. classifica in homepage).
// Quello di server.ts legge cookies(): chiamarlo da una pagina pubblica la rende
// dinamica e l'HTML esce con `no-store`, mai servito dalla CDN (issue #132).
// Solo viste/tabelle con grant anon; mai dati privati.
export function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
