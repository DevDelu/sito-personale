import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { Skills } from "@/components/home/Skills";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Contact } from "@/components/home/Contact";
import { Sfera } from "@/components/sfere/Sfera";
import { ContatoreSfere } from "@/components/sfere/ContatoreSfere";
import { QuizSection } from "@/components/quiz/QuizSection";
import { baseUrlPubblica, jsonLdSicuro, metadataPubblica, personaJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return metadataPubblica({ locale, percorso: "/", title: t("title"), description: t("description") });
}

// Il teaser del quiz (top 5 in classifica) è una query diretta a Supabase in
// un Server Component: revalidate qui, a livello di route segment, tiene la
// classifica ragionevolmente fresca senza farla ricalcolare a ogni request.
export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Meta");
  const persona = personaJsonLd({ base: baseUrlPubblica(), jobTitle: t("jobTitle") });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSicuro(persona) }} />
      <Hero />
      <div className="relative">
        <About />
        <Sfera n={2} className="right-3 top-24 md:right-[12%]" />
      </div>
      <div className="relative">
        <QuizSection />
        <Sfera n={3} className="bottom-1 left-[18%]" />
      </div>
      <div className="relative">
        <Skills />
        <Sfera n={4} className="right-[22%] top-10" />
      </div>
      <div className="relative">
        <FeaturedProjects />
        <Sfera n={5} className="bottom-1 right-6" />
      </div>
      <div className="relative">
        <Contact />
        <Sfera n={6} className="left-4 top-8 md:left-[8%]" />
        <Sfera n={7} className="bottom-1 right-[35%]" />
      </div>
      <ContatoreSfere />
    </>
  );
}
