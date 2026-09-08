import type { Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { PublicHeader } from "@/components/public-header";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Sovrascrive il theme-color di base (app/layout.tsx, palette dell'app
// privata) con quello di .site-public: sono due palette diverse, usare
// quella sbagliata è quello che si vedeva come "barra nera" sopra
// l'header pubblico anche a tema chiaro.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f0e7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1210" },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="site-public flex min-h-full flex-1 flex-col bg-background text-foreground">
        <PublicHeader />
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
