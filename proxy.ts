import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

// Rotte non sotto app/[locale]/ (area privata, login, api): restano gestite
// da updateSession() esattamente come prima, senza passare dal middleware
// next-intl. /progetti è invece sotto app/[locale]/progetti (bilingue).
const UNLOCALIZED_PREFIXES = [
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
// Login e recupero password vivono fuori da app/[locale]/: senza queste voci
// next-intl le prende per pagine pubbliche e risponde 404 (link "Password
// dimenticata?", link dell'email di recupero e pagina della nuova password).
const UNLOCALIZED_EXACT_ROUTES = ["/login", "/login/recupera-password", "/auth/callback", "/reset-password"];

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isUnlocalized =
    UNLOCALIZED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    UNLOCALIZED_EXACT_ROUTES.includes(pathname) ||
    pathname.startsWith("/api/");

  if (isUnlocalized) {
    return updateSession(request);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)",
  ],
};
