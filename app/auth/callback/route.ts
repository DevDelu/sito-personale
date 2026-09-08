import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Callback OAuth Supabase generica (query param `code` -> sessione via
// cookie). Il login Google del quiz è temporaneamente disattivato (provider
// non configurato lato Supabase), quindi al momento non c'è nulla che la
// invochi: resta qui pronta per quando verrà riabilitato, nessuna logica
// specifica al quiz.
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
