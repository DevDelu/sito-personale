import { getLocale, getTranslations } from "next-intl/server";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";
import { DownloadCvButton } from "@/components/home/download-cv-button";
import { HeroCursorField } from "@/components/home/hero-cursor-field";
import { HeroHeadline } from "@/components/home/hero-headline";

const LINKEDIN_URL = "https://www.linkedin.com/in/lorenzo-de-luca-83819a277/";
// Un CV per lingua: quello inglese non è solo il testo tradotto, ha un
// taglio pensato per il mercato anglofono (AI Product Engineering).
const CV_URL_BY_LOCALE: Record<string, string> = {
  it: "/cv-it.pdf",
  en: "/cv-en.pdf",
};

// Gerarchia esplicita tra i 3 CTA: "Contattami" è l'azione primaria (piena,
// accent), LinkedIn e CV sono alternative secondarie (outline, meno peso).
// Prima erano visivamente identiche — nessuna leggeva come l'azione
// consigliata, il che sul biglietto da visita di una persona reale è
// indecisione, non intenzionalità.
const HERO_PRIMARY_CLASS =
  "shrink-0 whitespace-nowrap rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md sm:px-6 sm:py-3 sm:text-base";
const HERO_SECONDARY_CLASS =
  "shrink-0 whitespace-nowrap rounded-md border border-border px-4 py-2.5 text-sm font-medium text-muted transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:text-foreground sm:px-5 sm:py-3 sm:text-base";

export async function Hero() {
  const t = await getTranslations("Hero");
  const locale = await getLocale();
  const cvUrl = CV_URL_BY_LOCALE[locale] ?? CV_URL_BY_LOCALE.it;

  return (
    <div className="relative w-full flex-1 overflow-hidden">
      <HeroCursorField />
      <main className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-20 text-center">
        <RevealGroup className="flex flex-col items-center gap-6">
          <RevealItem>
            <HeroHeadline text={t("headline")} />
          </RevealItem>
          <RevealItem>
            <p className="max-w-md text-base text-muted sm:text-lg">{t("subtitle")}</p>
          </RevealItem>
          <RevealItem className="flex flex-nowrap items-center justify-center gap-2 overflow-x-auto pt-2 sm:gap-3">
            <a href="#contatti" className={HERO_PRIMARY_CLASS}>
              {t("ctaContact")}
            </a>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className={HERO_SECONDARY_CLASS}>
              {t("linkedin")}
            </a>
            <DownloadCvButton href={cvUrl} filename={cvUrl.slice(1)} label={t("ctaCv")} className={HERO_SECONDARY_CLASS} />
          </RevealItem>
        </RevealGroup>
      </main>
    </div>
  );
}
