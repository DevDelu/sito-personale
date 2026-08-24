import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";

export async function PublicHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-4 sm:px-8">
      <Link href="/" className="font-mono text-sm tracking-tight text-foreground">
        lorenzo<span className="text-accent">.</span>
      </Link>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
