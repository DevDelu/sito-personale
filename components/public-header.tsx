import { ThemeToggle } from "@/components/theme-toggle";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";

// pt con safe-area-inset-top: su iPhone (notch/Dynamic Island, viewportFit
// "cover" in app/layout.tsx) senza questo padding l'header parte da sotto
// l'area di sistema, lasciando sopra una striscia non gestita dal layout
// che sul tema scuro si vede come una banda scura estranea alla pagina.
export async function PublicHeader() {
  const t = await getTranslations("PublicNav");
  return (
    <header className="flex h-16 items-center justify-end px-6 pt-[env(safe-area-inset-top)] sm:px-8">
      {/* Visibile solo con il focus da tastiera: salta al <main> del layout [locale]. */}
      <a
        href="#contenuto"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-[max(env(safe-area-inset-top),1rem)] focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-accent-foreground"
      >
        {t("skipToContent")}
      </a>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
