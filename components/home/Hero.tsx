import { getTranslations } from "next-intl/server";

// TODO(Lorenzo): sostituisci con l'URL reale del tuo profilo LinkedIn.
const LINKEDIN_URL = "https://linkedin.com";

export async function Hero() {
  const t = await getTranslations("Hero");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        {t("headline")}
      </h1>
      <p className="max-w-md text-muted">{t("subtitle")}</p>
      <a
        href={LINKEDIN_URL}
        target="_blank"
        rel="noreferrer"
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        {t("linkedin")}
      </a>
    </main>
  );
}
