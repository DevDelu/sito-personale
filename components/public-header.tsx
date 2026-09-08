import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

// pt con safe-area-inset-top: su iPhone (notch/Dynamic Island, viewportFit
// "cover" in app/layout.tsx) senza questo padding l'header parte da sotto
// l'area di sistema, lasciando sopra una striscia non gestita dal layout
// che sul tema scuro si vede come una banda scura estranea alla pagina.
export async function PublicHeader() {
  return (
    <header className="flex h-16 items-center justify-end px-6 pt-[env(safe-area-inset-top)] sm:px-8">
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
