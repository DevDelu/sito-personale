import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";
import { SectionEyebrow } from "@/components/home/section-eyebrow";

export async function About() {
  const t = await getTranslations("About");

  return (
    <section id="chi-sono" className="mx-auto w-full max-w-5xl border-t border-border px-6 py-16">
      <RevealGroup className="flex flex-col gap-8 sm:flex-row sm:items-start">
        <RevealItem className="shrink-0 self-center sm:self-start">
          <div className="relative h-48 w-48 overflow-hidden rounded-md border border-border sm:h-56 sm:w-56">
            <Image
              src="/images/lorenzo-about.jpg"
              alt="Lorenzo De Luca"
              fill
              sizes="224px"
              className="object-cover"
              style={{ objectPosition: "50% 15%" }}
            />
          </div>
        </RevealItem>

        <div className="flex max-w-md flex-col gap-4">
          <RevealItem>
            <SectionEyebrow>chi-sono</SectionEyebrow>
            <h2 className="font-sans text-2xl font-bold tracking-tight">{t("title")}</h2>
          </RevealItem>
          <RevealItem className="flex flex-col gap-4 text-base leading-relaxed text-muted">
            <p>{t("p1")}</p>
            <p>{t("p2")}</p>
            <p>{t("p3")}</p>
            <p>{t("p4")}</p>
          </RevealItem>
        </div>
      </RevealGroup>
    </section>
  );
}
