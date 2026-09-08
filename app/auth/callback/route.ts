import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Callback OAuth Supabase generica (query param `code` -> sessione via
// cookie). Usata oggi dal login Google del quiz, riusabile in futuro anche
// per un eventuale login Google della dashboard privata: nessuna logica
// specifica al quiz qui dentro, solo lo scambio code -> sessione.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("redirect_to") ?? "/";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(redirectTo, url.origin));
}
