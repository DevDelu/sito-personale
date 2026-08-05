import { getTranslations } from "next-intl/server";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";

// TODO(Lorenzo): sostituisci con l'URL reale del tuo profilo LinkedIn.
const LINKEDIN_URL = "https://linkedin.com";
// TODO(Lorenzo): carica il CV in public/ e aggiorna questo percorso.
const CV_URL = "/cv.pdf";

export async function Hero() {
  const t = await getTranslations("Hero");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <RevealGroup className="flex flex-col items-center gap-6">
        <RevealItem>
          <h1 className="font-display max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("headline")}
          </h1>
        </RevealItem>
        <RevealItem>
          <p className="max-w-md text-muted">{t("subtitle")}</p>
        </RevealItem>
        <RevealItem className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="#contatti"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            {t("ctaContact")}
          </a>
          <a
            href={CV_URL}
            download
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-hover hover:shadow-sm"
          >
            {t("ctaCv")}
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-hover hover:shadow-sm"
          >
            {t("linkedin")}
          </a>
        </RevealItem>
      </RevealGroup>
    </main>
  );
}
