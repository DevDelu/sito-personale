import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { HtmlLangSync } from "@/components/html-lang-sync";
import { PublicHeader } from "@/components/public-header";
import { baseUrlPubblica } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// URL assoluti per og:image e canonical delle pagine pubbliche (lib/seo.ts).
export const metadata: Metadata = { metadataBase: new URL(baseUrlPubblica()) };

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
        <HtmlLangSync />
        <MotionProvider>
          <PublicHeader />
          {children}
        </MotionProvider>
      </div>
    </NextIntlClientProvider>
  );
}
