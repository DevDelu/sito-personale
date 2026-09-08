import { getLocale, getTranslations } from "next-intl/server";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";
import { DownloadCvButton } from "@/components/home/download-cv-button";
import { HeroHeadline } from "@/components/home/hero-headline";

const LINKEDIN_URL = "https://www.linkedin.com/in/lorenzo-de-luca-83819a277/";
// Un CV per lingua: quello inglese non è solo il testo tradotto, ha un
// taglio pensato per il mercato anglofono (AI Product Engineering).
const CV_URL_BY_LOCALE: Record<string, string> = {
  it: "/cv-it.pdf",
  en: "/cv-en.pdf",
};

// Stesso stile per i 3 bottoni (contattami, LinkedIn, CV): nessuno dei tre
// deve spiccare come azione "primaria", sono alternative equivalenti.
const HERO_BUTTON_CLASS =
  "shrink-0 whitespace-nowrap rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-hover sm:px-6 sm:py-3 sm:text-base";

export async function Hero() {
  const t = await getTranslations("Hero");
  const locale = await getLocale();
  const cvUrl = CV_URL_BY_LOCALE[locale] ?? CV_URL_BY_LOCALE.it;

  return (
    <div className="relative w-full flex-1 overflow-hidden">
      <main className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-2xl flex-col items-center justify-center gap-8 px-6 py-20 text-center">
        <RevealGroup className="flex flex-col items-center gap-8">
          <RevealItem>
            <HeroHeadline text={t("headline")} />
          </RevealItem>
          <RevealItem className="flex flex-nowrap items-center justify-center gap-2 overflow-x-auto pt-2 sm:gap-3">
            <a href="#contatti" className={HERO_BUTTON_CLASS}>
              {t("ctaContact")}
            </a>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className={HERO_BUTTON_CLASS}>
              {t("linkedin")}
            </a>
            <DownloadCvButton href={cvUrl} filename={cvUrl.slice(1)} label={t("ctaCv")} className={HERO_BUTTON_CLASS} />
          </RevealItem>
        </RevealGroup>
      </main>
    </div>
  );
}
