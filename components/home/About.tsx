import { getTranslations } from "next-intl/server";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";
import { SectionEyebrow } from "@/components/home/section-eyebrow";

export async function About() {
  const t = await getTranslations("About");

  return (
    <section id="chi-sono" className="mx-auto w-full max-w-2xl border-t border-border px-6 py-16">
      <RevealGroup>
        <RevealItem>
          <SectionEyebrow>chi-sono</SectionEyebrow>
          <h2 className="font-sans text-2xl font-bold tracking-tight">{t("title")}</h2>
        </RevealItem>
        <RevealItem className="mt-4 flex flex-col gap-4 text-base leading-relaxed text-muted">
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
