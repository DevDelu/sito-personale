import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isOwner } from "@/lib/supabase/owner";

const PROTECTED_PREFIXES = ["/spese", "/investimenti", "/carte", "/allenamenti", "/agenda"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
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
