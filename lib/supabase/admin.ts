import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Usa la service role key: bypassa la Row Level Security.
// Va importato SOLO da Server Component, Server Action o Route Handler,
// mai da codice che finisce nel bundle client. L'accesso resta comunque
// protetto a monte da proxy.ts + requireUser() (login obbligatorio).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
