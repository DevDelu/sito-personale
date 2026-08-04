"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("PublicNav");
  const nextLocale = locale === "it" ? "en" : "it";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      aria-label={nextLocale === "en" ? t("switchToEnglish") : t("switchToItalian")}
      className="group flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm font-medium text-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-hover hover:shadow-sm active:scale-90"
    >
      {nextLocale.toUpperCase()}
    </button>
  );
}
