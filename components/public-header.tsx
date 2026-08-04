import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export async function PublicHeader() {
  const t = await getTranslations("PublicNav");

  return (
    <header className="flex items-center justify-between px-6 py-4 sm:px-8">
      <Link href="/" className="font-display text-sm font-semibold tracking-tight">
        Delu
      </Link>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        <NextLink
          href="/login"
          className="rounded-full border border-border px-4 py-2 text-sm text-muted transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-hover hover:text-foreground hover:shadow-sm"
        >
          {t("privateArea")}
        </NextLink>
      </div>
    </header>
  );
}
