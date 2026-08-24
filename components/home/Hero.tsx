import { getTranslations } from "next-intl/server";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";

const LINKEDIN_URL = "https://www.linkedin.com/in/lorenzo-de-luca-83819a277/";
// TODO(Lorenzo): carica il CV in public/ e aggiorna questo percorso.
const CV_URL = "/cv.pdf";

export async function Hero() {
  const t = await getTranslations("Hero");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-20">
      <RevealGroup className="flex flex-col gap-6">
        <RevealItem>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            # lorenzo-de-luca
          </span>
        </RevealItem>
        <RevealItem>
          <h1 className="font-sans max-w-xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            {t("headline")}
          </h1>
        </RevealItem>
        <RevealItem>
          <p className="max-w-md text-base leading-relaxed text-muted">{t("subtitle")}</p>
        </RevealItem>
        <RevealItem className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href="#contatti"
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
          >
            {t("ctaContact")}
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-hover"
          >
            {t("linkedin")}
          </a>
          <a
            href={CV_URL}
            download
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-hover"
          >
            {t("ctaCv")}
          </a>
        </RevealItem>
      </RevealGroup>
    </main>
  );
}
