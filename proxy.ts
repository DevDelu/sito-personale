import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

// Rotte non sotto app/[locale]/ (private, login, api, e /progetti che ha il
// suo design system dedicato non ancora integrato con next-intl): restano
// gestite da updateSession() esattamente come prima, senza passare dal
// middleware next-intl.
const UNLOCALIZED_PREFIXES = ["/spese", "/investimenti", "/carte", "/progetti"];
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
