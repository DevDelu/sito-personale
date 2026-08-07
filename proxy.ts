import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

// Rotte non sotto app/[locale]/ (area privata, login, api): restano gestite
// da updateSession() esattamente come prima, senza passare dal middleware
// next-intl. /progetti è invece sotto app/[locale]/progetti (bilingue).
const UNLOCALIZED_PREFIXES = ["/spese", "/investimenti", "/carte", "/allenamenti", "/agenda"];
const UNLOCALIZED_EXACT_ROUTES = ["/login"];

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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
