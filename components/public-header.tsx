import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";

// Prima l'header aveva solo i due switcher a destra, senza alcuna identità:
// da /progetti/[slug] l'unico modo di tornare alla home era un link testuale
// "← indietro" in fondo alla pagina. Il wordmark a sinistra dà al sito
// un'identità persistente e un'affordance "torna alla home" da ogni pagina.
export async function PublicHeader() {
  return (
    <header className="flex h-16 items-center justify-between px-6 sm:px-8">
      <Link href="/" className="font-display text-base font-medium tracking-tight">
        Lorenzo De Luca
      </Link>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
