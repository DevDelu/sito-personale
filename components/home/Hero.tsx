import { getLocale, getTranslations } from "next-intl/server";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";
import { DownloadCvButton } from "@/components/home/download-cv-button";

const LINKEDIN_URL = "https://www.linkedin.com/in/lorenzo-de-luca-83819a277/";
// Un CV per lingua: quello inglese non è solo il testo tradotto, ha un
// taglio pensato per il mercato anglofono (AI Product Engineering).
const CV_URL_BY_LOCALE: Record<string, string> = {
  it: "/cv-it.pdf",
  en: "/cv-en.pdf",
};

export async function Hero() {
  const t = await getTranslations("Hero");
  const locale = await getLocale();
  const cvUrl = CV_URL_BY_LOCALE[locale] ?? CV_URL_BY_LOCALE.it;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <RevealGroup className="flex flex-col items-center gap-6">
        <RevealItem>
          <h1 className="font-sans max-w-xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            {t("headline")}
          </h1>
        </RevealItem>
        <RevealItem className="flex flex-nowrap items-center justify-center gap-2 overflow-x-auto pt-2 sm:gap-3">
          <a
            href="#contatti"
            className="shrink-0 whitespace-nowrap rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md sm:px-5 sm:py-2.5"
          >
            {t("ctaContact")}
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 whitespace-nowrap rounded-md border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-hover sm:px-5 sm:py-2.5"
          >
            {t("linkedin")}
          </a>
          <DownloadCvButton
            href={cvUrl}
            filename={cvUrl.slice(1)}
            label={t("ctaCv")}
            className="shrink-0 whitespace-nowrap rounded-md border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-hover sm:px-5 sm:py-2.5"
          />
        </RevealItem>
      </RevealGroup>
    </main>
  );
}
