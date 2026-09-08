import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";

export async function About() {
  const t = await getTranslations("About");

  return (
    <section id="chi-sono" className="mx-auto w-full max-w-5xl border-t border-border px-6 py-16">
      <RevealGroup className="flex flex-col gap-10 sm:flex-row sm:items-start sm:gap-8">
        <div className="flex flex-1 flex-col gap-4">
          <RevealItem>
            <h2 className="font-sans text-2xl font-bold tracking-tight">{t("title")}</h2>
          </RevealItem>
          <RevealItem className="flex flex-col gap-4 text-base leading-relaxed text-muted">
            <p>{t("p1")}</p>
            <p>{t("p2")}</p>
            <p>{t("p3")}</p>
            <p>{t("p4")}</p>
          </RevealItem>
        </div>

        <RevealItem className="shrink-0 self-center sm:self-start">
          <Image
            src="/images/lorenzo-about.png"
            alt="Lorenzo De Luca"
            width={738}
            height={1145}
            sizes="(min-width: 640px) 320px, 240px"
            className="h-auto w-[240px] object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.25)] sm:w-[320px]"
            priority
          />
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
