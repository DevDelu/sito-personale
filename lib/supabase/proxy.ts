import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isOwner, isTester } from "@/lib/supabase/owner";

const PROTECTED_PREFIXES = [
  "/spese",
  "/investimenti",
  "/carte",
  "/allenamenti",
  "/agenda",
  "/alimentazione",
  "/impostazioni",
  "/altro",
  "/feedback",
];

// API che si autenticano da sole e restano fuori dal controllo owner qui
// sotto: il quiz è multi-utente per scelta, cron e agenti usano un secret
// Bearer verificato nella route stessa.
const API_AUTONOME = [
  "/api/quiz/",
  "/api/cron/",
  "/api/agenda/cron-sync",
  "/api/agenda/note-reminder",
  "/api/feedback/agente",
];

// GET con effetti o dati troppo sensibili anche per un tester in sola
// lettura: collegamento Google (OAuth) e lettura delle email.
const API_VIETATE_AL_TESTER = ["/api/agenda/auth/", "/api/agenda/mail"];

// Voci che finiscono con "/" coprono tutto il sottoalbero, le altre solo la
// rotta esatta e i suoi figli (/api/agenda/mail non copre /api/agenda/mailx).
function inizia(pathname: string, prefissi: string[]) {
  return prefissi.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(`${p}/`)));
}

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  // Questi header li imposta SOLO questo proxy (sotto, dopo getUser()), e
  // dal.ts li considera già verificati: vanno scartati se arrivano dal
  // client, altrimenti bastava inviarli a mano con l'email dell'owner per
  // superare getUser()/isOwner() su qualunque route /api/*.
  requestHeaders.delete("x-verified-user-id");
  requestHeaders.delete("x-verified-user-email");
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
  const isTesterUser = isTester(user?.email);
  const lettura = request.method === "GET" || request.method === "HEAD";

  // Controllo centrale per TUTTE le API private: prima molte route
  // verificavano solo getUser() (qualunque sessione, compreso un giocatore
  // del quiz con login Google) e non isOwner(). Qui: owner sempre, tester
  // solo in lettura e non sulle rotte vietate, nessun altro.
  if (pathname.startsWith("/api/") && !inizia(pathname, API_AUTONOME)) {
    const consentito =
      isOwnerUser || (isTesterUser && lettura && !inizia(pathname, API_VIETATE_AL_TESTER));
    if (!consentito) {
      return NextResponse.json(
        { error: user ? "Non autorizzato." : "Non autenticato." },
        { status: user ? 403 : 401 }
      );
    }
  }

  // Tester sulle pagine private: può navigare (GET) ma non inviare nulla.
  // Le Server Action sono POST verso la pagina, quindi finiscono qui.
  if (isProtected && isTesterUser && !lettura) {
    return NextResponse.json({ error: "Utente tester in sola lettura." }, { status: 403 });
  }

  if (isProtected && !isOwnerUser && !isTesterUser) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && (isOwnerUser || isTesterUser)) {
    return NextResponse.redirect(new URL("/spese", request.url));
  }

  return supabaseResponse;
}
