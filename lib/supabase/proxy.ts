import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isOwner } from "@/lib/supabase/owner";

const PROTECTED_PREFIXES = [
  "/spese",
  "/investimenti",
  "/carte",
  "/allenamenti",
  "/agenda",
  "/alimentazione",
  "/impostazioni",
  "/altro",
];

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: non rimuovere. Rinfresca il token di sessione leggendo
  // l'utente da Supabase Auth ad ogni richiesta.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Propaga l'esito di questa verifica (già fatta via rete qui sopra) ai
  // Server Component/Route Handler/Server Action a valle tramite header di
  // richiesta: lib/supabase/dal.ts la legge invece di richiamare
  // supabase.auth.getUser() una seconda volta per la stessa richiesta, che
  // raddoppiava il round-trip verso Supabase Auth su ogni navigazione
  // nell'area privata. La response viene ricostruita per includere gli
  // header aggiornati, riapplicando gli eventuali cookie di refresh sessione
  // impostati sopra da setAll().
  if (user) {
    requestHeaders.set("x-verified-user-id", user.id);
    requestHeaders.set("x-verified-user-email", user.email ?? "");
  }
  const responseWithHeaders = NextResponse.next({ request: { headers: requestHeaders } });
  supabaseResponse.cookies.getAll().forEach((cookie) => responseWithHeaders.cookies.set(cookie));
  supabaseResponse = responseWithHeaders;

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Un utente Google autenticato solo per il quiz pubblico non è il
  // proprietario: conta come "non loggato" per le route private, altrimenti
  // il redirect sotto (login → /spese) lo rimbalzerebbe in loop contro
  // requireUser() in app/(private)/layout.tsx.
  const isOwnerUser = isOwner(user?.email);

  if (isProtected && !isOwnerUser) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && isOwnerUser) {
    return NextResponse.redirect(new URL("/spese", request.url));
  }

  return supabaseResponse;
}
