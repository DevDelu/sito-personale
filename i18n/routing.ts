import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["it", "en"],
  defaultLocale: "it",
  localePrefix: "as-needed",
  // Niente cookie NEXT_LOCALE: un Set-Cookie su ogni risposta impedisce alla CDN di cachare l'HTML.
  localeCookie: false,
});
